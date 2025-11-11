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

    // Load order & customer
    const [orders] = await db.query(
      `SELECT o.order_id, o.order_code, o.user_id, o.total_amount
       FROM orders o
       WHERE o.order_id = ? AND o.user_id = ? LIMIT 1`,
      [order_id, userId]
    );
    if (!orders.length) {
      return res.status(404).json({ message: "Order not found" });
    }
    const order = orders[0];

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
        order_id: order.order_code, // must be unique string on Midtrans side
        gross_amount: Math.round(Number(order.total_amount) || 0),
      },
      customer_details: {
        first_name: firstName,
        last_name: lastName,
        email: user.email || "noreply@example.com",
        phone: user.phone_number || "",
      },
      credit_card: { secure: true },
      callbacks: {
        finish: `${frontendBase}/checkout/success?order=${order.order_code}`,
        unfinish: `${frontendBase}/checkout/pending?order=${order.order_code}`,
        error: `${frontendBase}/checkout/error?order=${order.order_code}`,
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

    // Save provider + reference (snap token) for tracking
    await db.query(
      "UPDATE orders SET payment_provider = ?, payment_reference = ? WHERE order_id = ?",
      ["midtrans", data?.token || null, order.order_id]
    );

    return res.json({
      message: "Snap transaction created",
      snap_token: data?.token,
      redirect_url: data?.redirect_url,
      order_code: order.order_code,
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
  // Map Midtrans status to our order/payment status
  // Ref: https://api-docs.midtrans.com/#transaction-status
  if (transactionStatus === "capture") {
    if (fraudStatus === "challenge") {
      return { payment_status: "unpaid", order_status: "pending_unpaid" };
    }
    return { payment_status: "paid", order_status: "waiting_confirmation" };
  }
  if (transactionStatus === "settlement") {
    return { payment_status: "paid", order_status: "waiting_confirmation" };
  }
  if (transactionStatus === "pending") {
    return { payment_status: "unpaid", order_status: "pending_unpaid" };
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
  return { payment_status: "unpaid", order_status: "pending_unpaid" };
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
      order_id: orderCode,
      transaction_status,
      fraud_status,
      transaction_id,
      payment_type,
    } = body;

    const statusMap = mapTransactionToStatuses(
      transaction_status,
      fraud_status
    );

    await db.query(
      `UPDATE orders
       SET status = ?, payment_status = ?, payment_provider = ?, payment_reference = ?
       WHERE order_code = ?`,
      [
        statusMap.order_status,
        statusMap.payment_status,
        "midtrans",
        transaction_id || payment_type || null,
        orderCode,
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
