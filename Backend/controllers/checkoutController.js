const db = require('../config/database');

async function loadCartSelected(userId) {
  // Ambil cart id
  const [carts] = await db.query('SELECT cart_id, selected_address_id FROM carts WHERE user_id = ? LIMIT 1', [userId]);
  if (!carts.length) return { cartId: null, addressId: null, items: [], shippingSelections: [], voucher: null };
  const cartId = carts[0].cart_id;
  const addressId = carts[0].selected_address_id;

  const [items] = await db.query(
    `SELECT ci.*,
            s.name AS store_name
     FROM cart_items ci
     JOIN stores s ON s.store_id = ci.store_id
     WHERE ci.cart_id = ? AND ci.selected = 1
     ORDER BY ci.created_at DESC`,
    [cartId]
  );
  const [ship] = await db.query('SELECT * FROM cart_shipping_selections WHERE cart_id = ?', [cartId]);
  const [cv] = await db.query('SELECT voucher_id, voucher_code, discount_amount FROM cart_vouchers WHERE cart_id = ? LIMIT 1', [cartId]);
  return { cartId, addressId, items, shippingSelections: ship, voucher: cv.length ? cv[0] : null };
}

async function loadAddressDetail(userId, addressId) {
  if (!addressId) return null;
  const [rows] = await db.query('SELECT * FROM user_addresses WHERE userAddress_id = ? AND user_id = ? LIMIT 1', [addressId, userId]);
  return rows.length ? rows[0] : null;
}

async function checkStock(items) {
  const errors = [];
  for (const it of items) {
    if (it.product_sku_id) {
      const [rows] = await db.query('SELECT stock FROM product_skus WHERE product_sku_id = ? LIMIT 1', [it.product_sku_id]);
      const stock = rows.length ? Number(rows[0].stock) : 0;
      if (stock < it.quantity) errors.push({ cart_item_id: it.cart_item_id, reason: 'INSUFFICIENT_STOCK_SKU', available: stock });
    } else {
      const [rows] = await db.query('SELECT stock FROM products WHERE product_id = ? LIMIT 1', [it.product_id]);
      const stock = rows.length ? Number(rows[0].stock) : 0;
      if (stock < it.quantity) errors.push({ cart_item_id: it.cart_item_id, reason: 'INSUFFICIENT_STOCK_PRODUCT', available: stock });
    }
  }
  return errors;
}

exports.getCheckoutSummary = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  try {
    const { cartId, addressId, items, shippingSelections, voucher } = await loadCartSelected(userId);
    if (!cartId || items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    const address = await loadAddressDetail(userId, addressId);
    const stockErrors = await checkStock(items);

    // Group by store
    const byStore = {};
    for (const it of items) {
      if (!byStore[it.store_id]) byStore[it.store_id] = { store_id: it.store_id, store_name: it.store_name, items: [], shipping: null, subtotal: 0 };
      byStore[it.store_id].items.push(it);
      byStore[it.store_id].subtotal += Number(it.unit_price_snapshot) * it.quantity;
    }
    for (const s of shippingSelections) {
      if (byStore[s.store_id]) byStore[s.store_id].shipping = s;
    }
    const groups = Object.values(byStore);

    let subtotal = 0;
    let delivery = 0;
    let total_items = 0;
    for (const g of groups) {
      subtotal += g.subtotal;
      if (g.shipping) delivery += Number(g.shipping.delivery_fee || 0);
      for (const it of g.items) total_items += it.quantity;
    }
    const voucher_discount = voucher ? Number(voucher.discount_amount || 0) : 0;
    const total = Math.max(0, subtotal + delivery - voucher_discount);

    res.json({
      address,
      groups,
      voucher,
      summary: { total_items, subtotal, delivery, voucher_discount, total },
      stock_errors: stockErrors
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server Error' });
  }
};

async function getCartId(userId) {
  const [rows] = await db.query('SELECT cart_id FROM carts WHERE user_id = ? LIMIT 1', [userId]);
  return rows.length ? rows[0].cart_id : null;
}

// GET /api/checkout -> ringkasan checkout dari item yang selected di cart
exports.getCheckout = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  try {
    const cartId = await getCartId(userId);
    if (!cartId) return res.status(200).json({ groups: [], summary: { total_items: 0, subtotal: 0, delivery: 0, voucher_discount: 0, total: 0 }, address: null, voucher: null });

    // Ambil alamat terpilih (detail)
    const [cartRows] = await db.query('SELECT selected_address_id FROM carts WHERE cart_id = ?', [cartId]);
    const selectedAddressId = cartRows[0]?.selected_address_id || null;
    let address = null;
    if (selectedAddressId) {
      const [addrRows] = await db.query(
        'SELECT userAddress_id, label, recipient_name, phone_number, address_detail, postal_code, province, city, district, sub_district, latitude, longitude FROM user_addresses WHERE userAddress_id = ? AND user_id = ? LIMIT 1',
        [selectedAddressId, userId]
      );
      address = addrRows[0] || null;
    }

    // Ambil item selected
    const [items] = await db.query(
      `SELECT ci.*, s.name AS store_name
       FROM cart_items ci
       JOIN stores s ON s.store_id = ci.store_id
       WHERE ci.cart_id = ? AND ci.selected = 1
       ORDER BY ci.created_at DESC`,
      [cartId]
    );

    // Ambil shipping per toko
    const [shipRows] = await db.query('SELECT * FROM cart_shipping_selections WHERE cart_id = ?', [cartId]);
    const shipByStore = new Map(shipRows.map(r => [String(r.store_id), r]));

    // Voucher aktif di cart
    const [cvRows] = await db.query('SELECT voucher_id, voucher_code, discount_amount FROM cart_vouchers WHERE cart_id = ? LIMIT 1', [cartId]);
    const voucher = cvRows.length ? cvRows[0] : null;
    const voucherDiscount = voucher ? Number(voucher.discount_amount || 0) : 0;

    // Validasi stok & hitung
    const stores = {};
    let subtotal = 0;
    let totalQty = 0;
    const stockErrors = [];
    for (const it of items) {
      // Validasi stok terkini
      const [pRows] = await db.query('SELECT stock FROM products WHERE product_id = ?', [it.product_id]);
      const available = pRows.length ? Number(pRows[0].stock) : 0;
      if (available < it.quantity) {
        stockErrors.push({ cart_item_id: it.cart_item_id, product_id: it.product_id, available, requested: it.quantity });
      }
      if (!stores[it.store_id]) stores[it.store_id] = { store_id: it.store_id, store_name: it.store_name, items: [], shipping: null };
      stores[it.store_id].items.push(it);
      subtotal += Number(it.unit_price_snapshot) * it.quantity;
      totalQty += it.quantity;
    }
    for (const [storeId, sel] of shipByStore.entries()) {
      if (stores[storeId]) stores[storeId].shipping = sel;
    }
    const groups = Object.values(stores);

    // Delivery total
    let delivery = 0;
    for (const g of groups) {
      if (g.shipping) delivery += Number(g.shipping.delivery_fee || 0);
    }

    res.json({
      address,
      voucher,
      groups,
      stock_errors: stockErrors,
      summary: {
        total_items: totalQty,
        subtotal,
        delivery,
        voucher_discount: voucherDiscount,
        total: Math.max(0, subtotal + delivery - voucherDiscount)
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server Error' });
  }
};

// PUT /api/checkout/note/:store_id -> simpan catatan per toko (alias cart_shipping_selections.note)
exports.setStoreNote = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  const { store_id } = req.params;
  const { note } = req.body;
  try {
    const [cRows] = await db.query('SELECT cart_id FROM carts WHERE user_id = ? LIMIT 1', [userId]);
    if (!cRows.length) return res.status(404).json({ message: 'Cart not found' });
    const cartId = cRows[0].cart_id;
    const [rows] = await db.query('SELECT selection_id FROM cart_shipping_selections WHERE cart_id = ? AND store_id = ? LIMIT 1', [cartId, store_id]);
    if (rows.length) {
      await db.query('UPDATE cart_shipping_selections SET note = ? WHERE selection_id = ?', [note || null, rows[0].selection_id]);
    } else {
      // jika belum ada shipping selection, buat minimum record agar note tersimpan
      await db.query('INSERT INTO cart_shipping_selections (cart_id, store_id, courier_code, service_code, delivery_fee, note) VALUES (?, ?, ?, ?, ?, ?)', [cartId, store_id, 'N/A', 'N/A', 0, note || null]);
    }
    res.json({ message: 'Note saved' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server Error' });
  }
};


