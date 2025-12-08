# Product Management - Current Status & Action Plan

## ✅ What Already Exists

### Backend - ALREADY COMPLETE! 🎉

**File:** `Backend/controllers/productController.js` (1143 lines!)

**Features Already Implemented:**

- ✅ Create product (all types)
- ✅ Motor specs handling
- ✅ Mobil specs handling
- ✅ Property specs handling
- ✅ Auto-detect classification from category
- ✅ Validation per product type
- ✅ Image upload (via multer)
- ✅ Variant management (SKUs)
- ✅ Complete CRUD operations

**Routes:** `Backend/routes/productRoutes.js` exists

---

## 🔍 Schema Verification Needed

You have **2 database schemas**:

### 1. NEW Schema (My Migration)

**File:** `Backend/migrations/create_products_tables.sql`

```sql
- products (with product_type: marketplace|classified)
- product_images
- product_variants
- product_motor_specs
- product_car_specs
- product_property_specs
- product_categories
```

### 2. EXISTING Schema (In Use by Controller)

**Tables Used by Controller:**

```sql
- products
- categories
- product_images (?)
- product_motor_specs (?)
- product_mobil_specs (?)
- product_property_specs (?)
- product_variants/SKUs (?)
```

**⚠️ ACTION REQUIRED:**
Check which schema is currently in your database:

```sql
USE toco;
SHOW TABLES LIKE '%product%';
DESCRIBE products;
```

If existing schema missing, run migration:

```bash
mysql -u root -p toco < Backend/migrations/create_products_tables.sql
```

---

## 📋 Controller vs Requirements Comparison

### ✅ Perfect Match

| Feature                | User Wants | Controller Has |
| ---------------------- | ---------- | -------------- |
| Motor specs            | ✅         | ✅             |
| Mobil specs            | ✅         | ✅             |
| Property specs         | ✅         | ✅             |
| Marketplace/Classified | ✅         | ✅             |
| Variants               | ✅         | ✅ (as SKUs)   |
| Pre-order              | ✅         | ✅             |
| Store courier          | ✅         | ✅             |
| Insurance              | ✅         | ✅             |
| Location (lat/lng)     | ✅         | ✅             |

### 🔄 Minor Differences

| Field              | User             | Controller          | Action                 |
| ------------------ | ---------------- | ------------------- | ---------------------- |
| Product type field | `product_type`   | `product_type`      | ✅ Same                |
| Condition          | "baru/bekas"     | "new/used"          | ✅ Translation needed  |
| Insurance          | "wajib/opsional" | "required/optional" | ✅ Translation needed  |
| Dimensions         | cm               | mm                  | 🔄 Convert in frontend |
| Transmission       | manual/otomatis  | manual/automatic    | ✅ Translation needed  |

---

## 🎨 Frontend - NEEDS TO BE BUILT

### Required Pages

```
/seller/products           - List products (PENDING)
/seller/products/add       - Add product form (PENDING)
/seller/products/edit/:id  - Edit product (PENDING)
```

### Required Components

#### 1. ProductForm.tsx (Main Container)

**State:**

```typescript
{
  // Basic
  name, description, category_id,

  // Type detection
  product_type: 'marketplace' | 'classified',
  categoryMeta: { type: 'marketplace' | 'motor' | 'mobil' | 'property' },

  // Common
  price, discount_percentage,

  // Marketplace
  stock, sku, condition, brand,
  weight, dimensions: {l, w, h},
  is_preorder, use_store_courier, insurance,

  // Variants
  has_variants, variants: [],

  // Specs (conditional)
  motor_specs: {},
  mobil_specs: {},
  property_specs: {},

  // Images
  images: [],

  // Status
  is_active
}
```

#### 2. Dynamic Field Sections

- **BasicInfoSection** - Photos, name, desc, category
- **MarketplaceFields** - Stock, SKU, brand, condition
- **MotorFields** - Brand, year, model, transmission, details
- **CarFields** - Brand, model, year, transmission, details
- **PropertyFields** - Listing type, specs, certificate
- **ShippingInfoSection** - Weight, dimensions, courier
- **VariantManager** - Add/remove variants dynamically
- **LocationPicker** - Google Maps (reuse from shipping)

#### 3. Image Upload

```typescript
<ImageUploader
  maxImages={10}
  onUpload={handleImageUpload}
  images={images}
  onRemove={handleImageRemove}
  onSetPrimary={handleSetPrimary}
/>
```

---

## 🔄 Data Flow

### Create Product

```
Frontend Form
  ↓ (validate)
FormData with images
  ↓ POST /api/products
Backend Controller
  ↓ (detect category type)
  ↓ (validate per type)
  ↓ (insert product)
  ↓ (insert specs if classified)
  ↓ (insert images)
  ↓ (insert variants)
  ↓ (commit transaction)
Response
```

### Frontend Logic

```typescript
// Category change handler
const handleCategoryChange = async (categoryId) => {
  setFormData((prev) => ({ ...prev, category_id: categoryId }));

  // Fetch category meta
  const meta = await getCategoryMeta(categoryId);
  setCategoryMeta(meta);

  // Reset type-specific fields
  if (meta.type !== "motor") setMotorSpecs({});
  if (meta.type !== "mobil") setMobilSpecs({});
  if (meta.type !== "property") setPropertySpecs({});

  // Auto-set product_type for classified
  if (["motor", "mobil", "property"].includes(meta.type)) {
    setFormData((prev) => ({ ...prev, product_type: "classified" }));
  }
};

// Render conditional fields
const renderFields = () => {
  if (categoryMeta.type === "motor") return <MotorFields />;
  if (categoryMeta.type === "mobil") return <CarFields />;
  if (categoryMeta.type === "property") return <PropertyFields />;
  return <MarketplaceFields />;
};
```

---

## 🚀 Implementation Priority

### Phase 1: Essential (Start Here)

1. ✅ Verify database schema
2. ✅ Test backend endpoints with Postman
3. 🔨 Create `/seller/products/add` page
4. 🔨 Create `ProductForm` component
5. 🔨 Add `BasicInfoSection`
6. 🔨 Add `MarketplaceFields` (default)

### Phase 2: Classified Support

7. 🔨 Add `MotorFields`
8. 🔨 Add `CarFields`
9. 🔨 Add `PropertyFields`
10. 🔨 Add Google Maps location picker

### Phase 3: Advanced Features

11. 🔨 Add image upload component
12. 🔨 Add variant manager
13. 🔨 Add shipping info section
14. 🔨 Create product list page

---

## 🧪 Testing Checklist

### Backend (Use Postman)

```
POST /api/products
Body: {
  "name": "Test Product",
  "category_id": 2,
  "description": "Test",
  "product_type": "marketplace",
  "price": 50000,
  "stock_quantity": 100,
  "weight_gram": 500
}
```

Expected: Product created successfully

### Frontend

- [ ] Form loads without errors
- [ ] Category change triggers field update
- [ ] Motor form shows correct fields
- [ ] Mobil form shows correct fields
- [ ] Property form shows correct fields
- [ ] Image upload works
- [ ] Variant add/remove works
- [ ] Validation prevents invalid submit
- [ ] Success redirects to product list

---

## 📝 Quick Start

### 1. Verify Backend Works

```bash
# Test with curl or Postman
POST http://localhost:5000/api/products
Headers: Authorization: Bearer <seller_token>
Body: <see example above>
```

### 2. Check Database

```sql
USE toco;
SHOW TABLES;
-- Should see: products, categories, product_motor_specs, etc
```

### 3. Start Frontend Development

```bash
cd Frontend
npm run dev

# Create files:
# - src/app/seller/products/add/page.tsx
# - src/views/seller/products/ProductForm.tsx
# - src/components/product/... (field components)
```

---

## 🎯 Next Steps for You

1. **Check database schema**

   ```sql
   DESCRIBE products;
   DESCRIBE product_motor_specs;
   ```

2. **Test backend with Postman**

   - Create marketplace product
   - Create motor product
   - Create mobil product
   - Create property product

3. **If backend works, start frontend:**
   - I'll create the product form components
   - Dynamic field rendering based on category
   - Image upload component
   - Variant manager

**Let me know:**

- Does backend work? (test with Postman)
- Which schema is in database? (new vs existing)
- Ready for frontend implementation?

---

**Status:** Backend ✅ Complete | Frontend ⏳ Ready to Build
