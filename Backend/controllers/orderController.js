const db = require("../config/database");

function generateOrderCode() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TC${y}${m}${d}-${rand}`;
}

async function loadCartForOrder(userId) {
  const [carts] = await db.query(
    "SELECT cart_id, shipping_address_id FROM carts WHERE user_id = ? LIMIT 1",
    [userId]
  );
  if (!carts.length) return null;
  const cartId = carts[0].cart_id;
  const addressId = carts[0].shipping_address_id;

  const [items] = await db.query(
    `SELECT ci.*,
            s.name AS store_name,
            (SELECT url FROM product_images WHERE product_id = ci.product_id AND is_primary = 1 ORDER BY sort_order ASC LIMIT 1) AS image_url
     FROM cart_items ci
     JOIN stores s ON s.store_id = ci.store_id
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

exports.createOrder = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Muat keranjang terpilih
    const cart = await loadCartForOrder(userId);
    if (!cart || !cart.items.length) {
      await conn.rollback();
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Validasi alamat
    if (!cart.addressId) {
      await conn.rollback();
      return res
        .status(400)
        .json({ message: "Alamat pengiriman belum dipilih" });
    }
    const [addrRows] = await conn.query(
      `SELECT address_id, recipient_name, phone_number, address_line, postal_code,
       province, city, district, subdistrict FROM user_addresses WHERE address_id = ? AND user_id = ? LIMIT 1`,
      [cart.addressId, userId]
    );
    if (!addrRows.length) {
      await conn.rollback();
      return res.status(400).json({ message: "Alamat tidak ditemukan" });
    }
    const addr = addrRows[0];

    // Group by store
    const byStore = new Map();
    for (const it of cart.items) {
      if (!byStore.has(it.store_id))
        byStore.set(it.store_id, { items: [], shipping: null });
      byStore.get(it.store_id).items.push(it);
    }
    for (const s of cart.shippingSelections) {
      if (byStore.has(s.store_id)) byStore.get(s.store_id).shipping = s;
    }

    const created = [];
    // Satu store = satu order
    for (const [storeId, group] of byStore.entries()) {
      // Hitung subtotal & delivery
      let subtotal = 0;
      for (const it of group.items) {
        // Validasi stok realtime - handle SKU atau product
        if (it.product_sku_id) {
          // Validasi stok SKU
          const [skuRows] = await conn.query(
            "SELECT stock_quantity FROM product_skus WHERE product_sku_id = ? AND product_id = ? FOR UPDATE",
            [it.product_sku_id, it.product_id]
          );
          const stockAvail = skuRows.length
            ? Number(skuRows[0].stock_quantity)
            : 0;
          if (stockAvail < it.quantity) {
            await conn.rollback();
            return res.status(400).json({
              message: `Stok SKU tidak cukup untuk product_id ${it.product_id}`,
            });
          }
        } else {
          // Validasi stok product
          const [pRows] = await conn.query(
            "SELECT stock_quantity, name FROM products WHERE product_id = ? FOR UPDATE",
            [it.product_id]
          );
          const stockAvail = pRows.length ? Number(pRows[0].stock_quantity) : 0;
          if (stockAvail < it.quantity) {
            await conn.rollback();
            return res.status(400).json({
              message: `Stok tidak cukup untuk product_id ${it.product_id}`,
            });
          }
        }
        subtotal += Number(it.unit_price) * it.quantity;
      }
      const delivery = group.shipping
        ? Number(
            (group.shipping.delivery_fee ?? group.shipping.shipping_cost) || 0
          )
        : 0;
      const voucherDiscount = cart.voucher
        ? Number(cart.voucher.discount_amount || 0)
        : 0;
      const total = Math.max(0, subtotal + delivery - voucherDiscount);

      // Buat order
      const orderCode = generateOrderCode();
      const [ins] = await conn.query(
        `INSERT INTO orders (
           order_code, user_id, store_id, address_id,
           subtotal_amount, shipping_amount, discount_amount, total_amount,
           voucher_id, status, payment_status,
           shipping_courier_code, shipping_service_code, shipping_service_name,
           shipping_etd_min_days, shipping_etd_max_days, note
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_unpaid', 'unpaid', ?, ?, ?, ?, ?, NULL)`,
        [
          orderCode,
          userId,
          storeId,
          cart.addressId,
          subtotal,
          delivery,
          voucherDiscount,
          total,
          cart.voucher ? cart.voucher.voucher_id : null,
          group.shipping ? group.shipping.courier_code : null,
          group.shipping ? group.shipping.service_code : null,
          group.shipping ? group.shipping.service_name : null,
          group.shipping ? group.shipping.etd_min_days : null,
          group.shipping ? group.shipping.etd_max_days : null,
        ]
      );
      const orderId = ins.insertId;

      // Simpan alamat ke order_shipping
      await conn.query(
        `INSERT INTO order_shipping (
           order_id, recipient_name, phone_number, address_line, province, city, district, postal_code, latitude, longitude
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          addr.recipient_name,
          addr.phone_number,
          addr.address_line,
          addr.province,
          addr.city,
          addr.district || addr.subdistrict || null,
          addr.postal_code,
          addr.latitude,
          addr.longitude,
        ]
      );

      // Simpan item
      for (const it of group.items) {
        // Ambil SKU code jika ada
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, product_sku_id, quantity, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            it.product_id,
            it.product_sku_id || null,
            it.quantity,
            it.unit_price,
            Number(it.unit_price) * it.quantity,
          ]
        );
      }

      // Kurangi stok - handle SKU atau product
      for (const it of group.items) {
        if (it.product_sku_id) {
          await conn.query(
            "UPDATE product_skus SET stock_quantity = stock_quantity - ? WHERE product_sku_id = ?",
            [it.quantity, it.product_sku_id]
          );
        } else {
          await conn.query(
            "UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?",
            [it.quantity, it.product_id]
          );
        }
      }

      // Catat penggunaan voucher (jika ada)
      if (cart.voucher && cart.voucher.voucher_id) {
        try {
          await conn.query(
            `INSERT INTO voucher_usages (voucher_id, user_id, order_id)
             VALUES (?, ?, ?)`,
            [cart.voucher.voucher_id, userId, orderId]
          );
        } catch (err) {
          if (err.code !== "ER_DUP_ENTRY") throw err;
        }
      }

      // Log status
      await conn.query(
        `INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by, note)
         VALUES (?, NULL, 'pending_unpaid', 'system', 'Order created')`,
        [orderId]
      );

      created.push({
        order_id: orderId,
        order_code: orderCode,
        store_id: storeId,
        total_amount: total,
      });
    }

    // Bersihkan cart terpilih (opsional: hanya selected)
    await conn.query(
      "DELETE FROM cart_items WHERE cart_id = ? AND is_selected = 1",
      [cart.cartId]
    );
    await conn.query("DELETE FROM cart_shipping_selections WHERE cart_id = ?", [
      cart.cartId,
    ]);
    await conn.query("DELETE FROM cart_vouchers WHERE cart_id = ?", [
      cart.cartId,
    ]);

    await conn.commit();
    conn.release();
    return res.status(201).json({ message: "Order created", orders: created });
  } catch (e) {
    await conn.rollback();
    if (conn) conn.release();
    console.error(e);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Get order stats for user dropdown
exports.getOrderStats = async (req, res) => {
  const userId = req.user.user_id || req.user.id;

  try {
    // Count orders by status
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END) as unpaid,
        SUM(CASE WHEN status IN ('paid', 'processing', 'shipped') AND payment_status = 'paid' THEN 1 ELSE 0 END) as ongoing,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
       FROM orders 
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      total: Number(stats[0].total || 0),
      unpaid: Number(stats[0].unpaid || 0),
      ongoing: Number(stats[0].ongoing || 0),
      delivered: Number(stats[0].delivered || 0),
      cancelled: Number(stats[0].cancelled || 0),
    });
  } catch (error) {
    console.error("Error getting order stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyOrders = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  const {
    status = "all",
    q,
    sort = "created_desc",
    page = 1,
    limit = 20,
  } = req.query;

  const where = ["o.user_id = ?"];
  const params = [userId];
  if (status !== "all") {
    where.push("o.status = ?");
    params.push(status);
  }
  if (q) {
    where.push("(o.order_code LIKE ?)");
    params.push(`%${q}%`);
  }
  let orderBy = "o.created_at DESC";
  if (sort === "created_asc") orderBy = "o.created_at ASC";

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const [rows] = await db.query(
    `SELECT o.* FROM orders o WHERE ${where.join(
      " AND "
    )} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  const [cnt] = await db.query(
    `SELECT COUNT(*) as total FROM orders o WHERE ${where.join(" AND ")}`,
    params
  );
  res.json({
    orders: rows,
    total: cnt[0].total,
    page: parseInt(page),
    limit: parseInt(limit),
  });
};

exports.getOrderDetail = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  const { id } = req.params;
  const [rows] = await db.query(
    `SELECT * FROM orders WHERE order_id = ? AND user_id = ? LIMIT 1`,
    [id, userId]
  );
  if (!rows.length) return res.status(404).json({ message: "Order not found" });
  const order = rows[0];
  const [items] = await db.query(
    `SELECT * FROM order_items WHERE order_id = ?`,
    [id]
  );
  const [ship] = await db.query(
    `SELECT * FROM order_shipping WHERE order_id = ?`,
    [id]
  );
  const [logs] = await db.query(
    `SELECT * FROM order_status_logs WHERE order_id = ? ORDER BY created_at ASC`,
    [id]
  );
  res.json({ order, items, shipping: ship[0] || null, logs });
};

// Get seller order stats
exports.getSellerOrderStats = async (req, res) => {
  const userId = req.user.user_id || req.user.id;

  try {
    // resolve store_id
    const [s] = await db.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!s.length) {
      return res.status(403).json({ message: "User does not have a store" });
    }
    const storeId = s[0].store_id;

    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'paid' AND shipped_at IS NULL THEN 1 ELSE 0 END) as new_orders,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as to_ship,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
       FROM orders 
       WHERE store_id = ?`,
      [storeId]
    );

    res.json({
      total: Number(stats[0].total || 0),
      new_orders: Number(stats[0].new_orders || 0),
      to_ship: Number(stats[0].to_ship || 0),
      shipped: Number(stats[0].shipped || 0),
      delivered: Number(stats[0].delivered || 0),
      cancelled: Number(stats[0].cancelled || 0),
    });
  } catch (error) {
    console.error("Error getting seller order stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSellerOrders = async (req, res) => {
  const userId = req.user.user_id || req.user.id;

  try {
    // resolve store_id
    const [s] = await db.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!s.length) {
      return res.status(403).json({ message: "User does not have a store" });
    }
    const storeId = s[0].store_id;

    const {
      status = "all",
      q,
      period = "all",
      start_date,
      end_date,
      courier = "all",
      sort = "newest",
      page = 1,
      limit = 20,
    } = req.query;

    const where = ["o.store_id = ?"];
    const params = [storeId];

    // Status filtering
    if (status !== "all") {
      if (status === "new") {
        where.push("o.status = 'paid' AND o.shipped_at IS NULL");
      } else if (status === "to_ship") {
        where.push("o.status = 'processing'");
      } else {
        where.push("o.status = ?");
        params.push(status);
      }
    }

    // Search query
    if (q) {
      // Gunakan kolom yang sesuai schema saat ini: order_code & users.full_name
      where.push("(o.order_code LIKE ? OR u.full_name LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }

    // Period filtering
    if (period && period !== "all") {
      const now = new Date();
      let startDate, endDate;

      switch (period) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case "yesterday":
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case "7days":
          startDate = new Date(now.setDate(now.getDate() - 7));
          endDate = new Date();
          break;
        case "30days":
          startDate = new Date(now.setDate(now.getDate() - 30));
          endDate = new Date();
          break;
        case "this_month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59
          );
          break;
        case "custom":
          if (start_date) startDate = new Date(start_date);
          if (end_date) {
            endDate = new Date(end_date);
            endDate.setHours(23, 59, 59, 999);
          }
          break;
      }

      if (startDate) {
        where.push("o.created_at >= ?");
        params.push(startDate);
      }
      if (endDate) {
        where.push("o.created_at <= ?");
        params.push(endDate);
      }
    }

    // Courier filtering
    if (courier && courier !== "all") {
      where.push("os.courier_code = ?");
      params.push(courier.toUpperCase());
    }

    // Sorting
    let orderBy = "o.created_at DESC";
    if (sort === "oldest") {
      orderBy = "o.created_at ASC";
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Main query with joins
    const [rows] = await db.query(
      `SELECT 
        o.*,
        u.full_name as customer_name,
        u.email as customer_email,
        os.courier_code,
        os.service_name,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as items_count
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       LEFT JOIN order_shipments os ON o.order_id = os.order_id
       WHERE ${where.join(" AND ")}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Count total
    const [cnt] = await db.query(
      `SELECT COUNT(DISTINCT o.order_id) as total 
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       LEFT JOIN order_shipments os ON o.order_id = os.order_id
       WHERE ${where.join(" AND ")}`,
      params
    );

    res.json({
      orders: rows,
      total: cnt[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error getting seller orders:", error);
    res.status(500).json({ message: "Server error" });
  }
};
