const express = require("express");
const cors = require("cors");
const passport = require("passport");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
require("./config/passport");

// Test database connection before starting server
const db = require("./config/database");

const startServer = async () => {
  const isConnected = await db.testConnection();
  if (!isConnected) {
    process.exit(1);
  }

  // Impor kedua file
  const userRoutes = require("./routes/userRoutes");
  const authRegisterRoutes = require("./routes/authRegister");
  const authLoginRoutes = require("./routes/authLogin");
  const authGoogle = require("./routes/authGoogle");
  const addressRoutes = require("./routes/addressRoutes");
  const wilayahRoutes = require("./routes/wilayahRoutes");
  const sellerRoutes = require("./routes/sellerRoutes");
  const categoryRoutes = require("./routes/categories");
  const productRoutes = require("./routes/productRoutes");
  const cartRoutes = require("./routes/cartRoutes");
  const checkoutRoutes = require("./routes/checkoutRoutes");
  const voucherSellerRoutes = require("./routes/voucherSellerRoutes");
  const orderRoutes = require("./routes/orderRoutes");
  const shippingRoutes = require("./routes/shippingRoutes");
  const paymentRoutes = require("./routes/paymentRoutes");

  const app = express();

  // Rate limiting configuration
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: "Too many requests from this IP, please try again later."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // Apply rate limiting to all requests
  app.use(limiter);

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth requests per windowMs
    message: {
      error: "Too many authentication attempts, please try again later."
    },
    skipSuccessfulRequests: true,
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const isConnected = await db.testConnection();
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        database: isConnected ? "connected" : "disconnected",
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        status: "ERROR",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error.message
      });
    }
  });

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }));
  app.use(express.json());
  app.use("/api/users", userRoutes); // <-- Tambahkan ini
  app.use("/api/auth", authLimiter, authRegisterRoutes);
  app.use("/api/auth", authLimiter, authLoginRoutes);
  app.use("/api/auth", authLimiter, authGoogle);
  app.use("/api/addresses", addressRoutes);
  app.use("/api/wilayah", wilayahRoutes);
  app.use("/api/sellers", sellerRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/checkout", checkoutRoutes);
  app.use("/api/vouchers", voucherSellerRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/shipping", shippingRoutes);
  app.use("/api/payments", paymentRoutes);
  // Serve static uploads (product/store images)
  app.use("/uploads", express.static("uploads"));

  // Jalankan Server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server berjalan di port ${PORT}`));
};

startServer().catch(console.error);
