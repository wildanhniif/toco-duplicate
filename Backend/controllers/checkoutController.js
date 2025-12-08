const db = require("../config/database");

async function loadCartSelected(userId) {
  // Ambil cart id
  const [carts] = await db.query(
    "SELECT cart_id, shipping_address_id FROM carts WHERE user_id = ? LIMIT 1",
    [userId]
  );
  if (!carts.length)
    return {
      cartId: null,
      addressId: null,
      items: [],
      shippingSelections: [],
      voucher: null,
    };
  const cartId = carts[0].cart_id;
  const addressId = carts[0].shipping_address_id;

  const [items] = await db.query(
    `SELECT 
       ci.*,
       p.name AS product_name,
       p.store_id,
       p.weight_gram,
       p.price AS original_price,
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
     JOIN products p ON p.product_id = ci.product_id
     JOIN stores s ON s.store_id = p.store_id
     WHERE ci.cart_id = ? AND ci.is_selected = 1
     ORDER BY ci.created_at DESC`,
    [cartId]
  );
  const [shipRows] = await db.query(
    "SELECT * FROM cart_shipping_selections WHERE cart_id = ?",
    [cartId]
  );
  const [cv] = await db.query(
    "SELECT voucher_id, discount_amount FROM cart_vouchers WHERE cart_id = ? LIMIT 1",
    [cartId]
  );
  return {
    cartId,
    addressId,
    items,
    shippingSelections: shipRows.map((s) => ({
      ...s,
      delivery_fee: Number(s.shipping_cost ?? s.delivery_fee ?? 0),
    })),
    voucher: cv.length ? cv[0] : null,
  };
}

async function loadAddressDetail(userId, addressId) {
  if (!addressId) return null;
  const [rows] = await db.query(
    "SELECT * FROM user_addresses WHERE address_id = ? AND user_id = ? LIMIT 1",
    [addressId, userId]
  );
  return rows.length ? rows[0] : null;
}

async function checkStock(items) {
  const errors = [];
  for (const it of items) {
    if (it.sku_id) {
      const [rows] = await db.query(
        "SELECT stock_quantity FROM product_skus WHERE sku_id = ? LIMIT 1",
        [it.sku_id]
      );
      const stock = rows.length ? Number(rows[0].stock_quantity) : 0;
      if (stock < it.quantity)
        errors.push({
          cart_item_id: it.cart_item_id,
          reason: "INSUFFICIENT_STOCK_SKU",
          available: stock,
        });
    } else {
      const [rows] = await db.query(
        "SELECT stock_quantity FROM products WHERE product_id = ? LIMIT 1",
        [it.product_id]
      );
      const stock = rows.length ? Number(rows[0].stock_quantity) : 0;
      if (stock < it.quantity)
        errors.push({
          cart_item_id: it.cart_item_id,
          reason: "INSUFFICIENT_STOCK_PRODUCT",
          available: stock,
        });
    }
  }
  return errors;
}

exports.getCheckoutSummary = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  try {
    const { cartId, addressId, items, shippingSelections, voucher } =
      await loadCartSelected(userId);
    if (!cartId || items.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    const address = await loadAddressDetail(userId, addressId);
    const stockErrors = await checkStock(items);

    // Group by store
    const byStore = {};
    for (const it of items) {
      if (!byStore[it.store_id])
        byStore[it.store_id] = {
          store_id: it.store_id,
          store_name: it.store_name,
          items: [],
          shipping: null,
          subtotal: 0,
        };

      const originalPrice = Number(it.original_price || it.unit_price);
      const currentPrice = Number(it.unit_price);
      const discountPercent =
        originalPrice > currentPrice
          ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
          : 0;

      const itemDetail = {
        cart_item_id: it.cart_item_id,
        product_id: it.product_id,
        product_name: it.product_name || it.name || "",
        product_image: it.product_image || null,
        sku_id: it.sku_id,
        variation: it.variation_text || null,
        quantity: it.quantity,
        unit_price: currentPrice,
        original_price: originalPrice,
        discount_percent: discountPercent,
        weight_gram: it.weight_gram,
      };

      byStore[it.store_id].items.push(itemDetail);
      byStore[it.store_id].subtotal += currentPrice * it.quantity;
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
      if (g.shipping)
        delivery += Number(
          (g.shipping.delivery_fee ?? g.shipping.shipping_cost) || 0
        );
      for (const it of g.items) total_items += it.quantity;
    }
    const voucher_discount = voucher ? Number(voucher.discount_amount || 0) : 0;
    const total = Math.max(0, subtotal + delivery - voucher_discount);

    res.json({
      address,
      groups,
      voucher,
      summary: { total_items, subtotal, delivery, voucher_discount, total },
      stock_errors: stockErrors,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

async function getCartId(userId) {
  const [rows] = await db.query(
    "SELECT cart_id FROM carts WHERE user_id = ? LIMIT 1",
    [userId]
  );
  return rows.length ? rows[0].cart_id : null;
}

// GET /api/checkout -> ringkasan checkout dari item yang selected di cart
exports.getCheckout = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  try {
    const cartId = await getCartId(userId);
    if (!cartId)
      return res.status(200).json({
        groups: [],
        summary: {
          total_items: 0,
          subtotal: 0,
          delivery: 0,
          voucher_discount: 0,
          total: 0,
        },
        address: null,
        voucher: null,
      });

    // Ambil alamat terpilih (detail)
    const [cartRows] = await db.query(
      "SELECT shipping_address_id FROM carts WHERE cart_id = ?",
      [cartId]
    );
    const selectedAddressId = cartRows[0]?.shipping_address_id || null;
    let address = null;
    if (selectedAddressId) {
      const [addrRows] = await db.query(
        "SELECT address_id, label, recipient_name, phone_number, address_line, postal_code, province, city, district, subdistrict, latitude, longitude FROM user_addresses WHERE address_id = ? AND user_id = ? LIMIT 1",
        [selectedAddressId, userId]
      );
      address = addrRows[0] || null;
    }

    // Ambil item selected
    const [items] = await db.query(
      `SELECT ci.*, p.store_id, s.name AS store_name
       FROM cart_items ci
       JOIN products p ON p.product_id = ci.product_id
       JOIN stores s ON s.store_id = p.store_id
       WHERE ci.cart_id = ? AND ci.is_selected = 1
       ORDER BY ci.created_at DESC`,
      [cartId]
    );

    // Ambil shipping per toko
    const [shipRows] = await db.query(
      "SELECT * FROM cart_shipping_selections WHERE cart_id = ?",
      [cartId]
    );
    const shipByStore = new Map(
      shipRows.map((r) => [
        String(r.store_id),
        {
          ...r,
          delivery_fee: Number(r.shipping_cost ?? r.delivery_fee ?? 0),
        },
      ])
    );

    // Voucher aktif di cart
    const [cvRows] = await db.query(
      "SELECT voucher_id, discount_amount FROM cart_vouchers WHERE cart_id = ? LIMIT 1",
      [cartId]
    );
    const voucher = cvRows.length ? cvRows[0] : null;
    const voucherDiscount = voucher ? Number(voucher.discount_amount || 0) : 0;

    // Validasi stok & hitung
    const stores = {};
    let subtotal = 0;
    let totalQty = 0;
    const stockErrors = [];
    for (const it of items) {
      // Validasi stok terkini
      const [pRows] = await db.query(
        "SELECT stock_quantity FROM products WHERE product_id = ?",
        [it.product_id]
      );
      const available = pRows.length ? Number(pRows[0].stock_quantity) : 0;
      if (available < it.quantity) {
        stockErrors.push({
          cart_item_id: it.cart_item_id,
          product_id: it.product_id,
          available,
          requested: it.quantity,
        });
      }
      if (!stores[it.store_id])
        stores[it.store_id] = {
          store_id: it.store_id,
          store_name: it.store_name,
          items: [],
          shipping: null,
        };
      stores[it.store_id].items.push(it);
      subtotal += Number(it.unit_price) * it.quantity;
      totalQty += it.quantity;
    }
    for (const [storeId, sel] of shipByStore.entries()) {
      if (stores[storeId]) stores[storeId].shipping = sel;
    }
    const groups = Object.values(stores);

    // Delivery total
    let delivery = 0;
    for (const g of groups) {
      if (g.shipping)
        delivery += Number(
          (g.shipping.delivery_fee ?? g.shipping.shipping_cost) || 0
        );
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
        total: Math.max(0, subtotal + delivery - voucherDiscount),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// PUT /api/checkout/note/:store_id -> simpan catatan per toko (alias cart_shipping_selections.note)
exports.setStoreNote = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  const { store_id } = req.params;
  const { note } = req.body;
  try {
    const [cRows] = await db.query(
      "SELECT cart_id FROM carts WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!cRows.length)
      return res.status(404).json({ message: "Cart not found" });
    const cartId = cRows[0].cart_id;
    const [rows] = await db.query(
      "SELECT shipping_selection_id FROM cart_shipping_selections WHERE cart_id = ? AND store_id = ? LIMIT 1",
      [cartId, store_id]
    );
    if (rows.length) {
      await db.query(
        "UPDATE cart_shipping_selections SET note = ? WHERE shipping_selection_id = ?",
        [note || null, rows[0].shipping_selection_id]
      );
    } else {
      // jika belum ada shipping selection, buat minimum record agar note tersimpan
      await db.query(
        "INSERT INTO cart_shipping_selections (cart_id, store_id, courier_code, service_code, shipping_cost, note) VALUES (?, ?, ?, ?, ?, ?)",
        [cartId, store_id, "N/A", "N/A", 0, note || null]
      );
    }
    res.json({ message: "Note saved" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// POST /api/checkout/create-order -> Create order dari cart selected items
exports.createOrder = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Load cart data
    const { cartId, addressId, items, shippingSelections, voucher } =
      await loadCartSelected(userId);

    if (!cartId || items.length === 0) {
      await conn.rollback();
      return res
        .status(400)
        .json({ message: "Cart is empty or no items selected" });
    }

    if (!addressId) {
      await conn.rollback();
      return res.status(400).json({ message: "Shipping address not selected" });
    }

    // Validate stock
    const stockErrors = await checkStock(items);
    if (stockErrors.length > 0) {
      await conn.rollback();
      return res
        .status(400)
        .json({ message: "Stock insufficient", errors: stockErrors });
    }

    // Group items by store - satu order per store
    const byStore = {};
    for (const it of items) {
      if (!byStore[it.store_id])
        byStore[it.store_id] = {
          store_id: it.store_id,
          items: [],
          shipping: null,
        };
      byStore[it.store_id].items.push(it);
    }

    // Map shipping selections
    for (const s of shippingSelections) {
      if (byStore[s.store_id]) byStore[s.store_id].shipping = s;
    }

    const storeGroups = Object.values(byStore);
    const createdOrders = [];

    // Create order untuk setiap store
    for (const group of storeGroups) {
      const { store_id, items: storeItems, shipping } = group;

      // Calculate store order totals
      let storeSubtotal = 0;
      for (const it of storeItems) {
        storeSubtotal += Number(it.unit_price) * it.quantity;
      }

      const shippingCost = shipping
        ? Number((shipping.delivery_fee ?? shipping.shipping_cost) || 0)
        : 0;

      // Voucher discount proportional (simple: apply to first store only for now)
      const voucherDiscount =
        voucher && createdOrders.length === 0
          ? Number(voucher.discount_amount || 0)
          : 0;

      const totalAmount = Math.max(
        0,
        storeSubtotal + shippingCost - voucherDiscount
      );

      // Generate order number: TRX-YYYYMMDD-RANDOM
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomStr = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const orderNumber = `TRX-${dateStr}-${randomStr}`;

      // Get shipping note from cart_shipping_selections
      const orderNotes = shipping?.note || null;

      // Insert order
      const [orderResult] = await conn.query(
        `INSERT INTO orders (
          order_number, user_id, store_id, shipping_address_id,
          status, payment_status, subtotal_amount, shipping_cost,
          voucher_discount, total_amount, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          userId,
          store_id,
          addressId,
          "pending",
          "unpaid",
          storeSubtotal,
          shippingCost,
          voucherDiscount,
          totalAmount,
          orderNotes,
        ]
      );

      const orderId = orderResult.insertId;

      // Insert order items
      for (const it of storeItems) {
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, sku_id, quantity, unit_price)
           VALUES (?, ?, ?, ?, ?)`,
          [
            orderId,
            it.product_id,
            it.sku_id || null,
            it.quantity,
            it.unit_price,
          ]
        );

        // Reduce stock
        if (it.sku_id) {
          await conn.query(
            "UPDATE product_skus SET stock_quantity = stock_quantity - ? WHERE sku_id = ?",
            [it.quantity, it.sku_id]
          );
        } else {
          await conn.query(
            "UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?",
            [it.quantity, it.product_id]
          );
        }
      }

      // Insert order shipment if shipping info exists
      if (shipping && shipping.courier_code && shipping.service_code) {
        await conn.query(
          `INSERT INTO order_shipments (
            order_id, courier_code, service_code, service_name,
            etd_min_days, etd_max_days, shipping_cost
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            shipping.courier_code,
            shipping.service_code,
            shipping.service_name || null,
            shipping.etd_min_days || null,
            shipping.etd_max_days || null,
            shippingCost,
          ]
        );
      }

      // Log order status
      await conn.query(
        `INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, null, "pending", "customer", "Order created"]
      );

      createdOrders.push({
        order_id: orderId,
        order_number: orderNumber,
        store_id,
        total_amount: totalAmount,
      });
    }

    // Clear cart items yang sudah di-checkout
    await conn.query(
      "DELETE FROM cart_items WHERE cart_id = ? AND is_selected = 1",
      [cartId]
    );

    // Clear cart shipping selections
    await conn.query("DELETE FROM cart_shipping_selections WHERE cart_id = ?", [
      cartId,
    ]);

    // Clear cart voucher
    await conn.query("DELETE FROM cart_vouchers WHERE cart_id = ?", [cartId]);

    await conn.commit();

    res.status(201).json({
      success: true,
      message: "Orders created successfully",
      orders: createdOrders,
    });
  } catch (e) {
    await conn.rollback();
    console.error("Create order error:", e);
    res
      .status(500)
      .json({ message: "Failed to create order", error: e.message });
  } finally {
    conn.release();
  }
};
