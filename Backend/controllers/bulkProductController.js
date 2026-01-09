const db = require("../config/database");
const slugify = require("../utils/slugify");

/**
 * @desc    Bulk import products from CSV/Excel data
 * @route   POST /api/products/bulk-import
 * @access  Private (seller only)
 */
const bulkImport = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  
  try {
    // Get seller's store
    const [storeRows] = await db.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    
    if (!storeRows.length) {
      return res.status(403).json({ message: "User does not have a store" });
    }
    
    const store_id = storeRows[0].store_id;
    const { products } = req.body; // Array of product objects
    
    // Validation
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Products array is required" });
    }
    
    if (products.length > 50) {
      return res.status(400).json({ 
        message: "Maximum 50 products allowed per import" 
      });
    }
    
    const results = {
      success: [],
      failed: [],
      total: products.length,
    };
    
    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const rowNumber = i + 1;
      
      try {
        // Validate required fields
        if (!product.name || !product.category_id) {
          results.failed.push({
            row: rowNumber,
            data: product,
            error: "Missing required fields: name, category_id"
          });
          continue;
        }
        
        // Validate price and stock
        const price = parseFloat(product.price) || 0;
        const stock = parseInt(product.stock_quantity) || 0;
        const weight = parseInt(product.weight_gram) || 0;
        
        if (price < 0) {
          results.failed.push({
            row: rowNumber,
            data: product,
            error: "Price cannot be negative"
          });
          continue;
        }
        
        if (stock < 0) {
          results.failed.push({
            row: rowNumber,
            data: product,
            error: "Stock cannot be negative"
          });
          continue;
        }
        
        if (weight < 0) {
          results.failed.push({
            row: rowNumber,
            data: product,
            error: "Weight cannot be negative"
          });
          continue;
        }

        // Validate dimensions
        const length = parseInt(product.length_mm);
        const width = parseInt(product.width_mm);
        const height = parseInt(product.height_mm);

        if (isNaN(length) || length <= 0 || isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
          results.failed.push({
            row: rowNumber,
            data: product,
            error: "Dimensions (length, width, height) must be valid positive numbers"
          });
          continue;
        }
        
        // Generate unique slug
        const baseSlug = slugify(product.name, { lower: true, strict: true });
        const slug = await generateUniqueSlug(baseSlug);
        
        // Insert product
        const [productResult] = await db.query(
          `INSERT INTO products (
            store_id, category_id, name, slug, description, product_type,
            price, stock_quantity, sku, \`condition\`, brand, weight_gram,
            length_mm, width_mm, height_mm, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            store_id,
            product.category_id,
            product.name,
            slug,
            product.description || null,
            product.product_type || "marketplace",
            price,
            stock,
            product.sku || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, // Auto-generate if not provided
            product.condition || "new",
            product.brand || null,
            weight,
            product.length_mm || null,
            product.width_mm || null,
            product.height_mm || null,
            product.status || "active",
          ]
        );
        
        const product_id = productResult.insertId;
        
        // Handle images
        if (product.images && Array.isArray(product.images)) {
          for (let j = 0; j < product.images.length; j++) {
            await db.query(
              "INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)",
              [product_id, product.images[j], j]
            );
          }
        }
        
        // Handle variants if provided
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
          // Group variants by name
          const variantGroups = new Map();
          
          for (const v of product.variants) {
            if (!v.variant_name || !v.variant_value) continue;
            
            if (!variantGroups.has(v.variant_name)) {
              variantGroups.set(v.variant_name, new Set());
            }
            variantGroups.get(v.variant_name).add(v.variant_value);
          }
          
          // Create variant attributes
          const attributeIdByName = new Map();
          const optionIdByAttrAndValue = new Map();
          
          let sortOrder = 0;
          for (const [name, values] of variantGroups.entries()) {
            const [attrRes] = await db.query(
              "INSERT INTO product_variant_attributes (product_id, attribute_name, sort_order) VALUES (?, ?, ?)",
              [product_id, name, sortOrder++]
            );
            const attribute_id = attrRes.insertId;
            attributeIdByName.set(name, attribute_id);
            
            let optSortOrder = 0;
            for (const value of values) {
              const [optRes] = await db.query(
                "INSERT INTO product_variant_attribute_options (attribute_id, option_value, sort_order) VALUES (?, ?, ?)",
                [attribute_id, value, optSortOrder++]
              );
              optionIdByAttrAndValue.set(`${attribute_id}::${value}`, optRes.insertId);
            }
          }
          
          // Create SKUs
          for (const v of product.variants) {
            const variantPrice = parseFloat(v.price) || price;
            const variantStock = parseInt(v.stock) || 0;
            
            if (variantPrice < 0 || variantStock < 0) continue;
            
            const [skuRes] = await db.query(
              "INSERT INTO product_skus (product_id, sku_code, price, stock_quantity, weight_gram) VALUES (?, ?, ?, ?, ?)",
              [
                product_id,
                v.sku || `${product.sku || 'SKU'}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                variantPrice,
                variantStock,
                weight,
              ]
            );
            
            const sku_id = skuRes.insertId;
            
            // Link SKU to variant options
            const attrId = attributeIdByName.get(v.variant_name);
            if (attrId) {
              const optionId = optionIdByAttrAndValue.get(`${attrId}::${v.variant_value}`);
              if (optionId) {
                await db.query(
                  "INSERT INTO product_sku_options (sku_id, option_id) VALUES (?, ?)",
                  [sku_id, optionId]
                );
              }
            }
          }
        }
        
        results.success.push({
          row: rowNumber,
          product_id,
          name: product.name,
          slug,
        });
        
      } catch (error) {
        console.error(`Error importing product at row ${rowNumber}:`, error);
        results.failed.push({
          row: rowNumber,
          data: product,
          error: error.message || "Unknown error",
        });
      }
    }
    
    res.status(200).json({
      message: "Bulk import completed",
      results,
    });
    
  } catch (error) {
    console.error("Bulk import error:", error);
    res.status(500).json({ message: "Server error during bulk import" });
  }
};

/**
 * @desc    Download CSV template for bulk import
 * @route   GET /api/products/bulk-template
 * @access  Private (seller only)
 */
const downloadTemplate = async (req, res) => {
  try {
    // Fetch categories for reference
    const [categories] = await db.query("SELECT category_id, name FROM categories LIMIT 20");
    
    const template = `# Instructions:
# 1. Fill in the required fields: name, category_id, price, stock_quantity, weight_gram
# 2. Optional fields: description, sku, brand, condition (new/used), product_type (marketplace/classified)
# 3. For images, separate URLs with semicolons (;)
# 4. For variants, create additional rows with same product name but different variant_name, variant_value, variant_price, variant_stock
# 5. Maximum 50 products per import
# 
# Available Categories (first 20):
${categories.map(c => `# ${c.category_id} - ${c.name}`).join('\n')}
#
name,category_id,description,price,stock_quantity,weight_gram,sku,brand,condition,product_type,images,variant_name,variant_value,variant_price,variant_stock
"Example Product 1",1,"Product description here",100000,50,500,"SKU-001","Brand Name","new","marketplace","https://example.com/image1.jpg;https://example.com/image2.jpg","","","",""
"Example Product 2 with Variant",2,"Another product",75000,0,300,"SKU-002","","new","marketplace","","Size","S",70000,10
"Example Product 2 with Variant",2,"Another product",75000,0,300,"SKU-002","","new","marketplace","","Size","M",75000,15
"Example Product 2 with Variant",2,"Another product",75000,0,300,"SKU-002","","new","marketplace","","Size","L",80000,20`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="product_import_template.csv"');
    res.send(template);
    
  } catch (error) {
    console.error("Error generating template:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Helper function to generate unique slug
 */
async function generateUniqueSlug(baseSlug) {
  const [rows] = await db.query(
    "SELECT slug FROM products WHERE slug = ? OR slug LIKE ?",
    [baseSlug, `${baseSlug}-%`]
  );
  
  if (!rows.length) return baseSlug;
  
  let maxSuffix = 0;
  for (const row of rows) {
    const current = row.slug;
    if (current === baseSlug) {
      if (maxSuffix < 1) maxSuffix = 1;
      continue;
    }
    
    if (current.startsWith(`${baseSlug}-`)) {
      const suffixStr = current.substring(baseSlug.length + 1);
      const suffixNum = parseInt(suffixStr, 10);
      if (!isNaN(suffixNum) && suffixNum > maxSuffix) {
        maxSuffix = suffixNum;
      }
    }
  }
  
  return `${baseSlug}-${maxSuffix + 1}`;
}

module.exports = {
  bulkImport,
  downloadTemplate,
};
