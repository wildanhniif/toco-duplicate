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
  const debugRoutes = require("./routes/debug");
  const addressRoutes = require("./routes/addressRoutes");
  const wilayahRoutes = require("./routes/wilayahRoutes");
  const sellerRoutes = require("./routes/sellerRoutes");
  const storeRoutes = require("./routes/storeRoutes");
  const categoryRoutes = require("./routes/categories");
  const productRoutes = require("./routes/productRoutes");
  const cartRoutes = require("./routes/cartRoutes");
  const checkoutRoutes = require("./routes/checkoutRoutes");
  const voucherSellerRoutes = require("./routes/voucherSellerRoutes");
  const orderRoutes = require("./routes/orderRoutes");
  const shippingRoutes = require("./routes/shippingRoutes");
  const paymentRoutes = require("./routes/paymentRoutes");
  const uploadRoutes = require("./routes/uploadRoutes");
  const storeSettingsRoutes = require("./routes/storeSettings");
  const templateRoutes = require("./routes/templateRoutes");
  const voucherRoutes = require("./routes/voucherRoutes");
  const { uploadLimiter, authLimiter, checkoutLimiter } = require("./middleware/rateLimiters");
  const { sanitizeInput } = require("./middleware/validationMiddleware");

  const app = express();

  // Stricter rate limiting for auth endpoints (moved to rateLimiters.js)
  // ... CORS configured above ...

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const isConnected = await db.testConnection();
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        database: isConnected ? "connected" : "disconnected",
        uptime: process.uptime(),
      });
    } catch (error) {
      res.status(503).json({
        status: "ERROR",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error.message,
      });
    }
  });

  // Middleware
  // CORS configuration with whitelist
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    process.env.FRONTEND_URL,
    process.env.PRODUCTION_URL
  ].filter(Boolean); // Remove undefined values

  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions));

  // Rate limiting configuration (only strict in production)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // Apply rate limiting to all requests only in production
  if (process.env.NODE_ENV === "production") {
    app.use(limiter);
  }
  
  // Body parser with size limits to prevent DoS
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Body parser with size limits configured above
  app.use(passport.initialize());
  
  // Apply sanitization to all requests
  app.use(sanitizeInput);
  
  // Routes
  app.use("/api/users", userRoutes);
  app.use("/api/auth", authLimiter, authRegisterRoutes);
  app.use("/api/auth", authLimiter, authLoginRoutes);
  app.use("/api/auth", authLimiter, authGoogle);
  app.use("/api/debug", debugRoutes);
  app.use("/api/addresses", addressRoutes);
  app.use("/api/wilayah", wilayahRoutes);
  app.use("/api/sellers", sellerRoutes);
  app.use("/api/stores", storeRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/checkout", checkoutLimiter, checkoutRoutes);
  app.use("/api/vouchers", voucherSellerRoutes);
  app.use("/api/vouchers", voucherRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/shipping", shippingRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/upload", uploadLimiter, uploadRoutes);
  app.use("/api/store-settings", storeSettingsRoutes);
  app.use("/api/templates", templateRoutes);
  app.use("/api/templates", templateRoutes);
  // Serve static uploads (product/store images)
  app.use("/uploads", express.static("uploads"));
  
  // Global error handler (must be last)
  const { errorHandler, requestLogger } = require("./utils/errorHandler");
  app.use(requestLogger);
  app.use(errorHandler);

  // Jalankan Server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server berjalan di port ${PORT}`));
};

startServer().catch(console.error);
