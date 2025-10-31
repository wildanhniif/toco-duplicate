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
    "SELECT unit_price_snapshot, quantity, selected FROM cart_items WHERE cart_id = ?",
    [cartId]
  );
  let subtotal = 0;
  for (const it of items) {
    if (it.selected) subtotal += Number(it.unit_price_snapshot) * it.quantity;
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

// GET /api/cart -> ringkasan keranjang (group by store)
exports.getCart = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  try {
    const cartId = await getOrCreateCartId(userId);
    const [items] = await db.query(
      `SELECT ci.*, s.name AS store_name
       FROM cart_items ci
       JOIN stores s ON s.store_id = ci.store_id
       WHERE ci.cart_id = ?
       ORDER BY ci.created_at DESC`,
      [cartId]
    );
    const [shipRows] = await db.query(
      "SELECT * FROM cart_shipping_selections WHERE cart_id = ?",
      [cartId]
    );
    const [cartRows] = await db.query(
      "SELECT selected_address_id FROM carts WHERE cart_id = ?",
      [cartId]
    );
    const selected_address_id = cartRows[0]?.selected_address_id || null;

    // Ringkasan
    const stores = {};
    for (const it of items) {
      if (!stores[it.store_id])
        stores[it.store_id] = {
          store_id: it.store_id,
          store_name: it.store_name,
          items: [],
          shipping: null,
        };
      stores[it.store_id].items.push(it);
    }
    for (const s of shipRows) {
      if (stores[s.store_id]) stores[s.store_id].shipping = s;
    }
    const groups = Object.values(stores);

    // Total terpilih
    let subtotal = 0;
    let totalQty = 0;
    for (const g of groups) {
      for (const it of g.items) {
        if (it.selected) {
          subtotal += Number(it.unit_price_snapshot) * it.quantity;
          totalQty += it.quantity;
        }
      }
    }
    let delivery = 0;
    for (const g of groups) {
      if (g.shipping) delivery += Number(g.shipping.delivery_fee || 0);
    }

    // Voucher (jika ada)
    const [cvRows] = await db.query(
      "SELECT voucher_id, voucher_code, discount_amount FROM cart_vouchers WHERE cart_id = ? LIMIT 1",
      [cartId]
    );
    const voucher = cvRows.length ? cvRows[0] : null;
    const voucherDiscount = voucher ? Number(voucher.discount_amount || 0) : 0;

    res.json({
      cart_id: cartId,
      selected_address_id,
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
  const { product_id, product_sku_id, quantity = 1 } = req.body;
  if (!product_id)
    return res.status(400).json({ message: "product_id required" });
  try {
    const cartId = await getOrCreateCartId(userId);
    // Ambil snapshot product
    const [pRows] = await db.query(
      "SELECT product_id, store_id, name, price, weight_gram FROM products WHERE product_id = ?",
      [product_id]
    );
    if (!pRows.length)
      return res.status(404).json({ message: "Product not found" });
    const p = pRows[0];
    let unitPrice = p.price;
    let variantSnap = null;
    if (product_sku_id) {
      const [skuRows] = await db.query(
        "SELECT product_sku_id, price FROM product_skus WHERE product_sku_id = ? AND product_id = ?",
        [product_sku_id, product_id]
      );
      if (!skuRows.length)
        return res.status(404).json({ message: "SKU not found" });
      unitPrice = skuRows[0].price;
    }
    const [imgRows] = await db.query(
      "SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1",
      [product_id]
    );
    const imageUrl = imgRows.length ? imgRows[0].url : null;

    await db.query(
      `INSERT INTO cart_items (cart_id, store_id, product_id, product_sku_id, product_name_snapshot, variant_snapshot, image_url_snapshot, unit_price_snapshot, weight_gram_snapshot, quantity, selected)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        cartId,
        p.store_id,
        product_id,
        product_sku_id || null,
        p.name,
        variantSnap,
        imageUrl,
        unitPrice,
        p.weight_gram,
        quantity,
      ]
    );
    res.status(201).json({ message: "Added to cart" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// PUT /api/cart/items/:cart_item_id -> update qty / selected
exports.updateItem = async (req, res) => {
  const userId = req.user.user_id;
  const { cart_item_id } = req.params;
  const { quantity, selected } = req.body;
  try {
    const cartId = await getOrCreateCartId(userId);
    const [result] = await db.query(
      "UPDATE cart_items SET quantity = COALESCE(?, quantity), selected = COALESCE(?, selected) WHERE cart_item_id = ? AND cart_id = ?",
      [
        quantity,
        typeof selected === "boolean" ? (selected ? 1 : 0) : null,
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

// PATCH /api/cart/select -> pilih semua/none
exports.selectAll = async (req, res) => {
  const userId = req.user.user_id;
  const { selected } = req.body; // boolean
  try {
    const cartId = await getOrCreateCartId(userId);
    await db.query("UPDATE cart_items SET selected = ? WHERE cart_id = ?", [
      selected ? 1 : 0,
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
  const { address_id, userAddress_id } = req.body;
  const chosenId = userAddress_id || address_id;
  if (!chosenId)
    return res.status(400).json({ message: "address_id required" });
  try {
    const cartId = await getOrCreateCartId(userId);
    // Validasi alamat milik user
    const [rows] = await db.query(
      "SELECT userAddress_id FROM user_addresses WHERE userAddress_id = ? AND user_id = ?",
      [chosenId, userId]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Address not found" });
    await db.query(
      "UPDATE carts SET selected_address_id = ? WHERE cart_id = ?",
      [chosenId, cartId]
    );
    res.json({ message: "Address set" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// PUT /api/cart/shipping/:store_id -> set pilihan kurir/jasa dan ongkir per toko
exports.setShipping = async (req, res) => {
  const userId = req.user.user_id;
  const { store_id } = req.params;
  const {
    courier_code,
    service_code,
    service_name,
    etd_min_days,
    etd_max_days,
    delivery_fee,
    note,
  } = req.body;
  try {
    const cartId = await getOrCreateCartId(userId);
    // UPSERT
    const [rows] = await db.query(
      "SELECT selection_id FROM cart_shipping_selections WHERE cart_id = ? AND store_id = ?",
      [cartId, store_id]
    );
    if (rows.length) {
      await db.query(
        "UPDATE cart_shipping_selections SET courier_code=?, service_code=?, service_name=?, etd_min_days=?, etd_max_days=?, delivery_fee=?, note=? WHERE selection_id=?",
        [
          courier_code,
          service_code,
          service_name || null,
          etd_min_days || null,
          etd_max_days || null,
          delivery_fee || 0,
          note || null,
          rows[0].selection_id,
        ]
      );
    } else {
      await db.query(
        "INSERT INTO cart_shipping_selections (cart_id, store_id, courier_code, service_code, service_name, etd_min_days, etd_max_days, delivery_fee, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          cartId,
          store_id,
          courier_code,
          service_code,
          service_name || null,
          etd_min_days || null,
          etd_max_days || null,
          delivery_fee || 0,
          note || null,
        ]
      );
    }
    res.json({ message: "Shipping set" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// PUT /api/cart/voucher -> pasang voucher sederhana
exports.setVoucher = async (req, res) => {
  const userId = req.user.user_id;
  const { voucher_code } = req.body;
  try {
    const cartId = await getOrCreateCartId(userId);
    const voucher = await findVoucherByCode(voucher_code);
    if (!voucher)
      return res.status(404).json({ message: "Voucher not found or inactive" });
    const { subtotal } = await computeCartTotals(cartId);
    if (subtotal < Number(voucher.min_order_amount || 0)) {
      return res
        .status(400)
        .json({ message: "Subtotal not eligible for this voucher" });
    }
    const discount = calculateVoucherDiscount(voucher, subtotal);
    const [rows] = await db.query(
      "SELECT cart_id FROM cart_vouchers WHERE cart_id = ?",
      [cartId]
    );
    if (rows.length) {
      await db.query(
        "UPDATE cart_vouchers SET voucher_id=?, voucher_code=?, discount_amount=? WHERE cart_id=?",
        [voucher.voucher_id, voucher.code, discount, cartId]
      );
    } else {
      await db.query(
        "INSERT INTO cart_vouchers (cart_id, voucher_id, voucher_code, discount_amount) VALUES (?, ?, ?, ?)",
        [cartId, voucher.voucher_id, voucher.code, discount]
      );
    }
    res.json({ message: "Voucher set", discount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// POST /api/cart/validate-voucher -> hitung potongan tanpa menyimpan
exports.validateVoucher = async (req, res) => {
  const userId = req.user.user_id;
  const { voucher_code } = req.body;
  try {
    const cartId = await getOrCreateCartId(userId);
    const voucher = await findVoucherByCode(voucher_code);
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
