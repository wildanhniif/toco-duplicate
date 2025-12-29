const db = require("../config/database");

async function getOrCreateCartId(userId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      "SELECT cart_id FROM carts WHERE user_id = ?",
      [userId]
    );
    let cartId;
    if (rows.length) {
      cartId = rows[0].cart_id;
    } else {
      const [ins] = await conn.query("INSERT INTO carts (user_id) VALUES (?)", [
        userId,
      ]);
      cartId = ins.insertId;
    }
    await conn.commit();
    return cartId;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function computeCartTotals(cartId) {
  const [items] = await db.query(
    "SELECT unit_price, quantity, is_selected FROM cart_items WHERE cart_id = ?",
    [cartId]
  );
  let subtotal = 0;
  for (const it of items) {
    if (it.is_selected) subtotal += Number(it.unit_price) * it.quantity;
  }
  return { subtotal };
}

function calculateVoucherDiscount(voucher, subtotal) {
  if (subtotal <= 0) return 0;
  let discount = 0;
  if (voucher.type === "fixed") {
    discount = Number(voucher.value);
  } else if (voucher.type === "percent") {
    discount = subtotal * (Number(voucher.value) / 100);
  }
  if (voucher.max_discount != null)
    discount = Math.min(discount, Number(voucher.max_discount));
  return Math.max(0, Math.min(discount, subtotal));
}

async function findVoucherByCode(code) {
  const now = new Date();
  const [rows] = await db.query(
    `SELECT * FROM vouchers WHERE code = ? AND is_active = 1
     AND (start_at IS NULL OR start_at <= ?)
     AND (end_at IS NULL OR end_at >= ?)
     LIMIT 1`,
    [code, now, now]
  );
  return rows[0];
}

// GET /api/cart -> ringkasan keranjang (group by store) dengan product details
exports.getCart = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  try {
    const cartId = await getOrCreateCartId(userId);
    // Get cart items dengan product details lengkap
    const [items] = await db.query(
      `SELECT 
        ci.*,
        p.name AS product_name,
        p.price AS product_price,
        p.stock_quantity AS product_stock,
        p.weight_gram,
        p.store_id,
        s.name AS store_name,
        (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY sort_order ASC LIMIT 1) AS product_image,
        CASE 
          WHEN ci.sku_id IS NOT NULL THEN (
            SELECT GROUP_CONCAT(pvao.option_value ORDER BY pva.sort_order SEPARATOR ', ')
            FROM product_sku_options pso
            JOIN product_variant_attribute_options pvao ON pso.option_id = pvao.option_id
            JOIN product_variant_attributes pva ON pvao.attribute_id = pva.attribute_id
            WHERE pso.sku_id = ci.sku_id
          )
          ELSE NULL
        END AS variation_text
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       JOIN stores s ON s.store_id = p.store_id
       WHERE ci.cart_id = ?
       ORDER BY p.store_id, ci.created_at DESC`,
      [cartId]
    );
    const [shipRows] = await db.query(
      "SELECT * FROM cart_shipping_selections WHERE cart_id = ?",
      [cartId]
    );
    const [cartRows] = await db.query(
      "SELECT shipping_address_id FROM carts WHERE cart_id = ?",
      [cartId]
    );
    const shipping_address_id = cartRows[0]?.shipping_address_id || null;

    // Ringkasan dengan product details
    const stores = {};
    for (const it of items) {
      if (!stores[it.store_id])
        stores[it.store_id] = {
          store_id: it.store_id,
          store_name: it.store_name,
          items: [],
          shipping: null,
        };

      // Variasi (sudah berupa string hasil GROUP_CONCAT)
      const variationText = it.variation_text || null;

      // Calculate discount percentage
      const originalPrice = Number(it.original_price || it.unit_price);
      const currentPrice = Number(it.unit_price);
      const discountPercent =
        originalPrice > currentPrice
          ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
          : 0;

      // Format item dengan details lengkap
      const itemDetail = {
        cart_item_id: it.cart_item_id,
        product_id: it.product_id,
        product_name: it.product_name,
        product_image: it.product_image,
        sku_id: it.sku_id,
        variant_id: it.variant_id, // Still pass variant_id for future use
        variation: variationText,
        stock: it.product_stock,
        quantity: it.quantity,
        unit_price: currentPrice,
        original_price: originalPrice,
        discount_percent: discountPercent,
        is_selected: Boolean(it.is_selected),
        weight_gram: it.weight_gram,
        subtotal: currentPrice * it.quantity,
      };

      stores[it.store_id].items.push(itemDetail);
    }
    for (const s of shipRows) {
      if (stores[s.store_id]) {
        stores[s.store_id].shipping = {
          ...s,
          delivery_fee: Number(s.shipping_cost ?? s.delivery_fee ?? 0),
        };
      }
    }
    const groups = Object.values(stores);

    // Total terpilih
    let subtotal = 0;
    let totalQty = 0;
    for (const g of groups) {
      for (const it of g.items) {
        if (it.is_selected) {
          subtotal += Number(it.unit_price) * it.quantity;
          totalQty += it.quantity;
        }
      }
    }
    let delivery = 0;
    for (const g of groups) {
      if (g.shipping)
        delivery += Number(
          (g.shipping.delivery_fee ?? g.shipping.shipping_cost) || 0
        );
    }

    // Voucher (jika ada)
    const [cvRows] = await db.query(
      "SELECT voucher_id, discount_amount FROM cart_vouchers WHERE cart_id = ? LIMIT 1",
      [cartId]
    );
    const voucher = cvRows.length ? cvRows[0] : null;
    const voucherDiscount = voucher ? Number(voucher.discount_amount || 0) : 0;

    res.json({
      cart_id: cartId,
      shipping_address_id,
      groups,
      voucher,
      summary: {
        total_items: totalQty,
        subtotal,
        delivery,
        voucher_discount: voucherDiscount,
        total: Math.max(0, subtotal + delivery - voucherDiscount),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// POST /api/cart/items -> tambah item
exports.addItem = async (req, res) => {
  const userId = req.user.user_id;
  const { product_id, sku_id, quantity = 1 } = req.body;
  if (!product_id)
    return res.status(400).json({ message: "product_id required" });
  try {
    const cartId = await getOrCreateCartId(userId);
    
    // Ambil product info
    const [pRows] = await db.query(
      "SELECT product_id, store_id, name, price, weight_gram FROM products WHERE product_id = ?",
      [product_id]
    );
    if (!pRows.length)
      return res.status(404).json({ message: "Product not found" });
    const p = pRows[0];
    let unitPrice = p.price;
    let weightGram = p.weight_gram;
    
    // Handle SKU logic
    if (sku_id) {
      const [skuRows] = await db.query(
        "SELECT sku_id, price, weight_gram FROM product_skus WHERE sku_id = ? AND product_id = ?",
        [sku_id, product_id]
      );
      if (!skuRows.length)
        return res.status(404).json({ message: "SKU not found" });
      unitPrice = skuRows[0].price;
      // Gunakan weight dari SKU jika ada, fallback ke product weight
      if (skuRows[0].weight_gram) weightGram = skuRows[0].weight_gram;
    }

    // Check if item already exists in cart (Merge Logic)
    let query = "SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?";
    const params = [cartId, product_id];

    if (sku_id) {
      query += " AND sku_id = ?";
      params.push(sku_id);
    } else {
      query += " AND sku_id IS NULL";
    }

    const [existingItems] = await db.query(query, params);

    if (existingItems.length > 0) {
      // Item exists, update quantity
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + quantity;
      
      await db.query(
        "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?",
        [newQuantity, existingItem.cart_item_id]
      );
      res.json({ message: "Cart updated", cart_item_id: existingItem.cart_item_id });
    } else {
      // Item new, insert
      await db.query(
        `INSERT INTO cart_items (cart_id, product_id, sku_id, quantity, unit_price, is_selected)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [cartId, product_id, sku_id || null, quantity, unitPrice]
      );
      res.status(201).json({ message: "Added to cart" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// PUT /api/cart/items/:cart_item_id -> update qty / selected
exports.updateItem = async (req, res) => {
  const userId = req.user.user_id;
  const { cart_item_id } = req.params;
  const { quantity, is_selected } = req.body;
  try {
    const cartId = await getOrCreateCartId(userId);
    const [result] = await db.query(
      "UPDATE cart_items SET quantity = COALESCE(?, quantity), is_selected = COALESCE(?, is_selected) WHERE cart_item_id = ? AND cart_id = ?",
      [
        quantity,
        typeof is_selected === "boolean" ? (is_selected ? 1 : 0) : null,
        cart_item_id,
        cartId,
      ]
    );
    if (!result.affectedRows)
      return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Updated" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// DELETE /api/cart/items/:cart_item_id
exports.deleteItem = async (req, res) => {
  const userId = req.user.user_id;
  const { cart_item_id } = req.params;
  try {
    const cartId = await getOrCreateCartId(userId);
    const [result] = await db.query(
      "DELETE FROM cart_items WHERE cart_item_id = ? AND cart_id = ?",
      [cart_item_id, cartId]
    );
    if (!result.affectedRows)
      return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// DELETE /api/cart/items (bulk delete)
exports.deleteMultipleItems = async (req, res) => {
  const userId = req.user.user_id;
  const { cart_item_ids } = req.body; // array of IDs

  if (!Array.isArray(cart_item_ids) || cart_item_ids.length === 0) {
    return res.status(400).json({ message: "cart_item_ids array required" });
  }

  try {
    const cartId = await getOrCreateCartId(userId);
    const placeholders = cart_item_ids.map(() => "?").join(",");
    const [result] = await db.query(
      `DELETE FROM cart_items WHERE cart_item_id IN (${placeholders}) AND cart_id = ?`,
      [...cart_item_ids, cartId]
    );

    res.json({
      message: `${result.affectedRows} items deleted`,
      deleted_count: result.affectedRows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// DELETE /api/cart/items/selected (delete all selected items)
exports.deleteSelectedItems = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const cartId = await getOrCreateCartId(userId);
    const [result] = await db.query(
      "DELETE FROM cart_items WHERE cart_id = ? AND is_selected = 1",
      [cartId]
    );

    res.json({
      message: `${result.affectedRows} selected items deleted`,
      deleted_count: result.affectedRows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// PATCH /api/cart/select -> pilih semua/none
exports.selectAll = async (req, res) => {
  const userId = req.user.user_id;
  const { is_selected } = req.body; // boolean
  try {
    const cartId = await getOrCreateCartId(userId);
    await db.query("UPDATE cart_items SET is_selected = ? WHERE cart_id = ?", [
      is_selected ? 1 : 0,
      cartId,
    ]);
    res.json({ message: "Selection updated" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// PUT /api/cart/address -> set alamat pengiriman terpilih
exports.setAddress = async (req, res) => {
  const userId = req.user.user_id;
  const { address_id } = req.body;
  const chosenId = address_id;
  if (!chosenId)
    return res.status(400).json({ message: "address_id required" });
  try {
    const cartId = await getOrCreateCartId(userId);
    // Validasi alamat milik user
    const [rows] = await db.query(
      "SELECT address_id FROM user_addresses WHERE address_id = ? AND user_id = ?",
      [chosenId, userId]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Address not found" });
    await db.query(
      "UPDATE carts SET shipping_address_id = ? WHERE cart_id = ?",
      [chosenId, cartId]
    );
    res.json({ message: "Address set" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// PUT /api/cart/shipping/:store_id -> set pilihan kurir/jasa
// Body yang diterima: { courier_code, service_code, origin_id?, destination_id?, note }
// Backend akan menghitung ulang delivery_fee + etd berdasar data keranjang
exports.setShipping = async (req, res) => {
  const userId = req.user.user_id;
  const { store_id } = req.params;
  const { courier_code, service_code, origin_id, destination_id, note } =
    req.body;
  if (!courier_code || !service_code)
    return res
      .status(400)
      .json({ message: "courier_code dan service_code wajib diisi" });
  try {
    const cartId = await getOrCreateCartId(userId);

    // Hitung total berat (gram) item TERPILIH untuk store terkait
    const [wRows] = await db.query(
      `SELECT p.weight_gram, ci.quantity FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.cart_id = ? AND p.store_id = ? AND ci.is_selected = 1`,
      [cartId, store_id]
    );
    if (!wRows.length) {
      return res
        .status(400)
        .json({ message: "Tidak ada item terpilih untuk store ini" });
    }
    let totalWeight = 0;
    for (const r of wRows)
      totalWeight += Number(r.weight_gram || 0) * Number(r.quantity || 0);
    if (totalWeight <= 0) totalWeight = 100; // fallback minimal 100gr

    // Panggil komerce calculate domestik
    const apiKey = process.env.RAJAONGKIR_COST_API_KEY;
    const baseUrl =
      process.env.RAJAONGKIR_COST_BASE_URL ||
      "https://rajaongkir.komerce.id/api/v1";
    if (!apiKey)
      return res.status(500).json({
        message:
          "RAJAONGKIR_COST_API_KEY atau RAJAONGKIR_API_KEY belum diset di environment",
      });

    const headers = {
      key: apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const axios = require("axios");

    // Jika origin_id / destination_id tidak dikirim dari frontend,
    // tentukan otomatis berdasarkan alamat toko dan alamat pengiriman yang dipilih.
    let originToUse = origin_id;
    let destinationToUse = destination_id;

    if (!originToUse || !destinationToUse) {
      // Ambil lokasi toko
      const [storeRows] = await db.query(
        "SELECT province, city, district, subdistrict, postal_code FROM stores WHERE store_id = ? LIMIT 1",
        [store_id]
      );

      // Ambil alamat pengiriman yang terpilih di cart
      const [cartRows] = await db.query(
        "SELECT shipping_address_id FROM carts WHERE cart_id = ? LIMIT 1",
        [cartId]
      );
      const shippingAddressId = cartRows[0]?.shipping_address_id || null;

      if (!storeRows.length || !shippingAddressId) {
        return res.status(400).json({
          message:
            "Alamat toko atau alamat pengiriman belum lengkap untuk menghitung ongkir",
        });
      }

      const storeLoc = storeRows[0];
      const [addrRows] = await db.query(
        "SELECT province, city, district, subdistrict, postal_code FROM user_addresses WHERE address_id = ? LIMIT 1",
        [shippingAddressId]
      );

      if (!addrRows.length) {
        return res
          .status(400)
          .json({ message: "Alamat pengiriman tidak ditemukan" });
      }

      const destLoc = addrRows[0];
      const baseDestinationUrl = `${baseUrl}/destination/domestic-destination`;

      const buildSearch = (loc) =>
        [loc.subdistrict, loc.district, loc.city, loc.province, loc.postal_code]
          .filter(Boolean)
          .join(" ");

      const originSearch = buildSearch(storeLoc);
      const destSearch = buildSearch(destLoc);

      const searchConfig = (search) => ({
        headers: { key: apiKey },
        params: { search, limit: 10, offset: 0 },
      });

      const [originResp, destResp] = await Promise.all([
        axios.get(baseDestinationUrl, searchConfig(originSearch)),
        axios.get(baseDestinationUrl, searchConfig(destSearch)),
      ]);

      const originList = Array.isArray(originResp.data?.data)
        ? originResp.data.data
        : [];
      const destList = Array.isArray(destResp.data?.data)
        ? destResp.data.data
        : [];

      const pickLocation = (list, target) => {
        if (!Array.isArray(list) || list.length === 0) return null;

        // RajaOngkir returns: zip_code, city_name, district_name, subdistrict_name
        const postal = String(target.postal_code || "").trim();
        const city = (target.city || "")
          .toLowerCase()
          .replace(/^(kota|kabupaten|kab\.?)\s*/i, "");
        const district = (target.district || "").toLowerCase();
        const subdistrict = (target.subdistrict || "").toLowerCase();

        // Try exact match with postal code first
        const matchPostal = list.find((item) => {
          const itemPostal = String(
            item.zip_code || item.postal_code || ""
          ).trim();
          return postal && itemPostal === postal;
        });
        if (matchPostal) return matchPostal;

        // Try city + district match
        const matchCityDistrict = list.find((item) => {
          const itemCity = (item.city_name || item.city || "").toLowerCase();
          const itemDistrict = (
            item.district_name ||
            item.district ||
            ""
          ).toLowerCase();
          return itemCity.includes(city) && itemDistrict.includes(district);
        });
        if (matchCityDistrict) return matchCityDistrict;

        // Try city only match
        const matchCity = list.find((item) => {
          const itemCity = (item.city_name || item.city || "").toLowerCase();
          return itemCity.includes(city);
        });
        if (matchCity) return matchCity;

        // Last resort - return first result
        return list[0];
      };

      const originCandidate = pickLocation(originList, storeLoc);
      const destCandidate = pickLocation(destList, destLoc);

      if (
        !originCandidate ||
        !destCandidate ||
        originCandidate.id == null ||
        destCandidate.id == null
      ) {
        return res.status(400).json({
          message:
            "Gagal menentukan lokasi origin/destination untuk ongkir. Periksa alamat toko dan alamat pengiriman.",
        });
      }

      originToUse = originCandidate.id;
      destinationToUse = destCandidate.id;
    }

    const form = new URLSearchParams();
    form.append("origin", String(originToUse));
    form.append("destination", String(destinationToUse));
    form.append("weight", String(totalWeight));
    // RajaOngkir expects lowercase courier code
    form.append("courier", String(courier_code).toLowerCase());
    form.append("price", "lowest");

    console.log("setShipping - calling RajaOngkir:", {
      origin: originToUse,
      destination: destinationToUse,
      weight: totalWeight,
      courier: String(courier_code).toLowerCase(),
    });

    let list = [];
    try {
      const { data } = await axios.post(
        `${baseUrl}/calculate/domestic-cost`,
        form,
        { headers }
      );
      console.log(
        "setShipping - RajaOngkir response:",
        data?.meta,
        "results:",
        data?.data?.length
      );
      list = Array.isArray(data?.data) ? data.data : [];
    } catch (apiError) {
      console.log(
        "setShipping - RajaOngkir API error, using mock:",
        apiError?.response?.data?.meta?.message || apiError.message
      );

      // Mock data fallback
      const courierLower = String(courier_code).toLowerCase();
      const mockRates = {
        jne: [
          {
            name: "JNE",
            code: "jne",
            service: "REG",
            description: "JNE Regular",
            cost: 15000,
            etd: "2-3 hari",
          },
          {
            name: "JNE",
            code: "jne",
            service: "YES",
            description: "JNE Yes",
            cost: 25000,
            etd: "1 hari",
          },
          {
            name: "JNE",
            code: "jne",
            service: "OKE",
            description: "JNE Oke",
            cost: 12000,
            etd: "3-4 hari",
          },
        ],
        jnt: [
          {
            name: "J&T Express",
            code: "jnt",
            service: "EZ",
            description: "J&T Regular",
            cost: 12000,
            etd: "2-3 hari",
          },
          {
            name: "J&T Express",
            code: "jnt",
            service: "JSD",
            description: "J&T Same Day",
            cost: 30000,
            etd: "1 hari",
          },
        ],
        sicepat: [
          {
            name: "SiCepat",
            code: "sicepat",
            service: "REG",
            description: "SiCepat Regular",
            cost: 13000,
            etd: "2-3 hari",
          },
          {
            name: "SiCepat",
            code: "sicepat",
            service: "BEST",
            description: "SiCepat Best",
            cost: 18000,
            etd: "1-2 hari",
          },
        ],
        anteraja: [
          {
            name: "AnterAja",
            code: "anteraja",
            service: "REG",
            description: "AnterAja Regular",
            cost: 14000,
            etd: "2-3 hari",
          },
          {
            name: "AnterAja",
            code: "anteraja",
            service: "SD",
            description: "AnterAja Same Day",
            cost: 28000,
            etd: "1 hari",
          },
        ],
        pos: [
          {
            name: "POS Indonesia",
            code: "pos",
            service: "REG",
            description: "Pos Regular",
            cost: 10000,
            etd: "3-5 hari",
          },
          {
            name: "POS Indonesia",
            code: "pos",
            service: "EXPRESS",
            description: "Pos Express",
            cost: 20000,
            etd: "1-2 hari",
          },
        ],
      };

      const mockList = mockRates[courierLower] || [];
      const weightKg = Math.ceil(totalWeight / 1000);
      list = mockList.map((item) => ({
        ...item,
        cost: item.cost * weightKg,
      }));
    }

    // Cari service yang cocok - coba berbagai kombinasi case
    let picked = list.find(
      (x) =>
        String(x.code).toLowerCase() === String(courier_code).toLowerCase() &&
        String(x.service).toUpperCase() === String(service_code).toUpperCase()
    );

    // Coba match lebih lenient jika tidak ketemu
    if (!picked) {
      picked = list.find(
        (x) =>
          String(x.code).toLowerCase() === String(courier_code).toLowerCase()
      );
    }

    // Jika masih tidak ketemu, gunakan data dari request (dari shippingController mock)
    if (!picked) {
      console.log(
        `Service ${courier_code}/${service_code} not found in RajaOngkir, using request data`
      );
      // Accept the selection anyway - frontend already validated this from shippingController
      picked = {
        code: courier_code,
        service: service_code,
        name: `${String(courier_code).toUpperCase()} ${service_code}`,
        cost: req.body.cost || 15000, // Use cost from request if available
        etd: req.body.etd || "2-3 hari",
      };
    }

    const service_name = picked.name || `${courier_code} ${service_code}`;
    const cost = Number(picked.cost || req.body.cost || 15000);
    const etdText = String(picked.etd || req.body.etd || "2-3").toLowerCase();
    // Parse "2-3 day" -> 2,3
    let etd_min_days = null,
      etd_max_days = null;
    const match = etdText.match(/(\d+)\s*-\s*(\d+)/) || etdText.match(/(\d+)/);
    if (match) {
      if (match[2]) {
        etd_min_days = Number(match[1]);
        etd_max_days = Number(match[2]);
      } else {
        etd_min_days = Number(match[1]);
        etd_max_days = Number(match[1]);
      }
    }

    // UPSERT ke cart_shipping_selections
    const [rows] = await db.query(
      "SELECT shipping_selection_id FROM cart_shipping_selections WHERE cart_id = ? AND store_id = ?",
      [cartId, store_id]
    );
    if (rows.length) {
      await db.query(
        "UPDATE cart_shipping_selections SET courier_code=?, service_code=?, service_name=?, etd_min_days=?, etd_max_days=?, shipping_cost=? WHERE shipping_selection_id=?",
        [
          courier_code,
          service_code,
          service_name,
          etd_min_days,
          etd_max_days,
          cost,
          rows[0].shipping_selection_id,
        ]
      );
    } else {
      await db.query(
        "INSERT INTO cart_shipping_selections (cart_id, store_id, courier_code, service_code, service_name, etd_min_days, etd_max_days, shipping_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          cartId,
          store_id,
          courier_code,
          service_code,
          service_name,
          etd_min_days,
          etd_max_days,
          cost,
        ]
      );
    }

    res.json({
      message: "Shipping set",
      selection: {
        store_id: Number(store_id),
        courier_code,
        service_code,
        service_name,
        etd_min_days,
        etd_max_days,
        delivery_fee: cost,
      },
    });
  } catch (e) {
    console.error("setShipping error:", e?.response?.data || e.message);
    const status = e?.response?.status || 500;
    const message =
      e?.response?.data?.meta?.message || e.message || "Server Error";
    res.status(status).json({ message, details: e?.response?.data });
  }
};

// POST /api/cart/voucher - apply voucher dengan validasi proper
exports.applyVoucher = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  const { code } = req.body;
  
  if (!code) return res.status(400).json({ message: "Voucher code required" });
  
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const cartId = await getOrCreateCartId(userId);
    const now = new Date();
    
    // Find voucher with all validations
    const [vRows] = await conn.query(
      `SELECT * FROM vouchers 
       WHERE code = ? 
       AND is_active = 1 
       AND deleted_at IS NULL
       AND (started_at IS NULL OR started_at <= ?)
       AND (expired_at IS NULL OR expired_at >= ?)
       LIMIT 1`,
      [code, now, now]
    );
    
    if (!vRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: "Voucher tidak ditemukan atau sudah tidak berlaku" });
    }
    
    const voucher = vRows[0];
    
    // Check total usage limit (quota)
    if (voucher.quota && voucher.quota_used >= voucher.quota) {
      await conn.rollback();
      return res.status(400).json({ message: "Voucher sudah habis kuota" });
    }
    
    // Check usage limit
    if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
      await conn.rollback();
      return res.status(400).json({ message: "Voucher sudah mencapai batas penggunaan" });
    }
    
    // Check per-user usage limit
    if (voucher.limit_per_user) {
      const [usageRows] = await conn.query(
        "SELECT COUNT(*) as count FROM voucher_usage WHERE voucher_id = ? AND user_id = ?",
        [voucher.voucher_id, userId]
      );
      
      if (usageRows[0].count >= voucher.limit_per_user) {
        await conn.rollback();
        return res.status(400).json({ 
          message: `Anda sudah menggunakan voucher ini ${voucher.limit_per_user} kali (maksimal per user)` 
        });
      }
    }
    
    // Calculate cart totals
    const { subtotal } = await computeCartTotals(cartId);
    
    // Check minimum purchase
    if (voucher.min_purchase_amount && subtotal < Number(voucher.min_purchase_amount)) {
      await conn.rollback();
      return res.status(400).json({ 
        message: `Minimum pembelian untuk voucher ini adalah Rp ${Number(voucher.min_purchase_amount).toLocaleString('id-ID')}` 
      });
    }
    
    // Calculate discount
    const discount = calculateVoucherDiscount(voucher, subtotal);
    
    // Remove existing voucher if any
    await conn.query("DELETE FROM cart_vouchers WHERE cart_id = ?", [cartId]);
    
    // Apply new voucher
    await conn.query(
      "INSERT INTO cart_vouchers (cart_id, voucher_id, discount_amount) VALUES (?, ?, ?)",
      [cartId, voucher.voucher_id, discount]
    );
    
    await conn.commit();
    
    res.json({
      message: "Voucher applied successfully",
      voucher: {
        voucher_id: voucher.voucher_id,
        code: voucher.code,
        name: voucher.name,
        type: voucher.type,
        value: Number(voucher.value),
        discount_amount: discount,
      },
    });
  } catch (e) {
    await conn.rollback();
    console.error("Apply voucher error:", e);
    res.status(500).json({ message: "Server Error" });
  } finally {
    conn.release();
  }
};

// DELETE /api/cart/voucher - remove applied voucher
exports.removeVoucher = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  try {
    const cartId = await getOrCreateCartId(userId);
    await db.query("DELETE FROM cart_vouchers WHERE cart_id = ?", [cartId]);
    res.json({ message: "Voucher removed" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// POST /api/cart/validate-voucher -> hitung potongan tanpa menyimpan
exports.validateVoucher = async (req, res) => {
  const userId = req.user.user_id;
  const { code } = req.body;
  try {
    const cartId = await getOrCreateCartId(userId);
    const voucher = await findVoucherByCode(code);
    if (!voucher)
      return res.status(404).json({ message: "Voucher not found or inactive" });
    const { subtotal } = await computeCartTotals(cartId);
    if (subtotal < Number(voucher.min_order_amount || 0)) {
      return res
        .status(400)
        .json({ message: "Subtotal not eligible for this voucher" });
    }
    const discount = calculateVoucherDiscount(voucher, subtotal);
    res.json({
      voucher_id: voucher.voucher_id,
      code: voucher.code,
      subtotal,
      discount,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};
