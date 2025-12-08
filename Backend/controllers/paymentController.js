const axios = require("axios");
const crypto = require("crypto");
const db = require("../config/database");

function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is not set");
  }
  const base64ServerKey = Buffer.from(`${serverKey}:`).toString("base64");
  const snapUrl = "https://app.sandbox.midtrans.com/snap/v1/transactions";
  const statusBaseUrl = "https://api.sandbox.midtrans.com/v2";
  return { serverKey, base64ServerKey, snapUrl, statusBaseUrl };
}

exports.initPayment = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  const { order_id } = req.body; // numeric order_id from our DB
  if (!order_id) {
    return res.status(400).json({ message: "order_id is required" });
  }
  try {
    const { base64ServerKey, snapUrl } = getMidtransConfig();

    // Load order & customer (gunakan order_number di schema sekarang)
    const [orders] = await db.query(
      `SELECT o.order_id, o.order_number, o.user_id, o.total_amount
       FROM orders o
       WHERE o.order_id = ? AND o.user_id = ? LIMIT 1`,
      [order_id, userId]
    );
    if (!orders.length) {
      return res.status(404).json({ message: "Order not found" });
    }
    const order = orders[0];
    const orderNumber = order.order_number;
    const grossAmount = Math.round(Number(order.total_amount) || 0);

    const [users] = await db.query(
      "SELECT full_name, email, phone_number FROM users WHERE user_id = ? LIMIT 1",
      [userId]
    );
    const user = users[0] || {};
    const firstName = (user.full_name || "").split(" ")[0] || "Customer";
    const lastName = (user.full_name || "").replace(firstName, "").trim() || "";

    const frontendBase =
      process.env.MIDTRANS_CALLBACK_BASE_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:3000";
    const payload = {
      transaction_details: {
        order_id: orderNumber, // must be unique string on Midtrans side
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: firstName,
        last_name: lastName,
        email: user.email || "noreply@example.com",
        phone: user.phone_number || "",
      },
      credit_card: { secure: true },
      callbacks: {
        finish: `${frontendBase}/checkout/success?order=${orderNumber}`,
        unfinish: `${frontendBase}/checkout/pending?order=${orderNumber}`,
        error: `${frontendBase}/checkout/error?order=${orderNumber}`,
      },
    };

    const { data } = await axios.post(snapUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${base64ServerKey}`,
      },
      timeout: 15000,
    });

    // Simpan/Update record di tabel payments
    const [existingPayments] = await db.query(
      "SELECT payment_id FROM payments WHERE order_id = ? LIMIT 1",
      [order.order_id]
    );

    const rawResponse = JSON.stringify(data || null);

    if (existingPayments.length > 0) {
      await db.query(
        `UPDATE payments
         SET provider = ?, payment_status = ?, gross_amount = ?, currency = ?,
             payment_code = ?, redirect_url = ?, raw_response = ?, updated_at = NOW()
         WHERE payment_id = ?`,
        [
          "midtrans",
          "pending",
          grossAmount,
          "IDR",
          orderNumber,
          data?.redirect_url || null,
          rawResponse,
          existingPayments[0].payment_id,
        ]
      );
    } else {
      await db.query(
        `INSERT INTO payments (
           order_id, payment_code, provider, payment_status, gross_amount,
           currency, redirect_url, raw_response
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.order_id,
          orderNumber,
          "midtrans",
          "pending",
          grossAmount,
          "IDR",
          data?.redirect_url || null,
          rawResponse,
        ]
      );
    }

    return res.json({
      message: "Snap transaction created",
      snap_token: data?.token,
      redirect_url: data?.redirect_url,
      order_code: orderNumber,
    });
  } catch (e) {
    console.error(e?.response?.data || e);
    return res.status(500).json({ message: "Failed to init payment" });
  }
};

function verifySignatureKey(body, serverKey) {
  const { order_id, status_code, gross_amount, signature_key } = body || {};
  if (!order_id || !status_code || !gross_amount || !signature_key)
    return false;
  const raw = `${order_id}${status_code}${gross_amount}${serverKey}`;
  const expected = crypto.createHash("sha512").update(raw).digest("hex");
  return expected === signature_key;
}

function mapTransactionToStatuses(transactionStatus, fraudStatus) {
  // Map Midtrans status ke enum status di tabel orders
  // orders.status: 'pending','payment_pending','paid','processing','shipped','delivered','cancelled','returned'
  // orders.payment_status: 'unpaid','paid','refunded','partial_refund'
  if (transactionStatus === "capture") {
    if (fraudStatus === "challenge") {
      return { payment_status: "unpaid", order_status: "payment_pending" };
    }
    return { payment_status: "paid", order_status: "paid" };
  }
  if (transactionStatus === "settlement") {
    return { payment_status: "paid", order_status: "paid" };
  }
  if (transactionStatus === "pending") {
    return { payment_status: "unpaid", order_status: "payment_pending" };
  }
  if (transactionStatus === "deny" || transactionStatus === "cancel") {
    return { payment_status: "unpaid", order_status: "cancelled" };
  }
  if (transactionStatus === "expire") {
    return { payment_status: "unpaid", order_status: "cancelled" };
  }
  if (transactionStatus === "refund" || transactionStatus === "chargeback") {
    return { payment_status: "refunded", order_status: "cancelled" };
  }
  return { payment_status: "unpaid", order_status: "pending" };
}

function mapTransactionToPaymentStatus(transactionStatus) {
  // Map Midtrans status ke enum payment_status di tabel payments
  // payments.payment_status: 'pending','processing','success','failed','expired','cancelled','refunded'
  if (transactionStatus === "capture" || transactionStatus === "settlement") {
    return "success";
  }
  if (transactionStatus === "pending") {
    return "pending";
  }
  if (transactionStatus === "expire") {
    return "expired";
  }
  if (transactionStatus === "deny" || transactionStatus === "cancel") {
    return "cancelled";
  }
  if (transactionStatus === "refund" || transactionStatus === "chargeback") {
    return "refunded";
  }
  return "pending";
}

exports.notification = async (req, res) => {
  let body = req.body;
  try {
    const { serverKey } = getMidtransConfig();
    // Verify signature
    const isValid = verifySignatureKey(body, serverKey);
    if (!isValid) {
      return res.status(403).json({ message: "Invalid signature" });
    }
    const {
      order_id: orderNumber,
      transaction_status,
      fraud_status,
      transaction_id,
      payment_type,
    } = body;

    const statusMap = mapTransactionToStatuses(
      transaction_status,
      fraud_status
    );

    // Cari order berdasarkan order_number
    const [orderRows] = await db.query(
      "SELECT order_id, status FROM orders WHERE order_number = ? LIMIT 1",
      [orderNumber]
    );

    if (!orderRows.length) {
      console.warn("Midtrans notification: order not found for", orderNumber);
      return res.status(200).json({ message: "Order not found, ignored" });
    }

    const orderId = orderRows[0].order_id;

    await db.query(
      `UPDATE orders
       SET status = ?, payment_status = ?
       WHERE order_id = ?`,
      [statusMap.order_status, statusMap.payment_status, orderId]
    );

    const paymentStatus = mapTransactionToPaymentStatus(transaction_status);
    const grossAmount = Number(body.gross_amount || 0);
    const rawResponse = JSON.stringify(body || null);

    const [paymentRows] = await db.query(
      "SELECT payment_id FROM payments WHERE order_id = ? LIMIT 1",
      [orderId]
    );

    if (paymentRows.length) {
      await db.query(
        `UPDATE payments
         SET payment_status = ?, provider = ?, payment_type = ?, gross_amount = ?,
             currency = ?, transaction_id = ?, transaction_time = ?, raw_response = ?,
             status_message = ?
         WHERE payment_id = ?`,
        [
          paymentStatus,
          "midtrans",
          payment_type || null,
          grossAmount,
          "IDR",
          transaction_id || null,
          body.transaction_time || null,
          rawResponse,
          body.status_message || null,
          paymentRows[0].payment_id,
        ]
      );
    } else {
      await db.query(
        `INSERT INTO payments (
           order_id, payment_code, provider, payment_type, payment_status,
           gross_amount, currency, transaction_id, transaction_time,
           raw_response, status_message
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderNumber,
          "midtrans",
          payment_type || null,
          paymentStatus,
          grossAmount,
          "IDR",
          transaction_id || null,
          body.transaction_time || null,
          rawResponse,
          body.status_message || null,
        ]
      );
    }

    // Tambah log status order
    await db.query(
      `INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        orderId,
        orderRows[0].status,
        statusMap.order_status,
        "system",
        `Midtrans status: ${transaction_status}`,
      ]
    );

    return res.status(200).json({ message: "OK" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Notification handling failed" });
  }
};

exports.getStatus = async (req, res) => {
  const { order_code } = req.params;
  if (!order_code) {
    return res.status(400).json({ message: "order_code is required" });
  }
  try {
    const { base64ServerKey, statusBaseUrl } = getMidtransConfig();
    const url = `${statusBaseUrl}/${encodeURIComponent(order_code)}/status`;
    const { data } = await axios.get(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${base64ServerKey}`,
      },
      timeout: 15000,
    });
    return res.json(data);
  } catch (e) {
    console.error(e?.response?.data || e);
    return res.status(500).json({ message: "Failed to fetch status" });
  }
};
