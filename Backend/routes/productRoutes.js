// routes/productRoutes.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Impor fungsi controller yang sudah kita buat
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
  deleteProduct,
  setProductStatus,
  addProductImages,
} = require("../controllers/productController");

// Impor middleware proteksi
const { protect } = require("../middleware/authMiddleware");
const uploadDir = "uploads/products/";
const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });
    } catch (e) {
      return cb(e);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = (req.user?.id || "user") + "-" + Date.now();
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
const uploadProductImages = multer({ storage: productImageStorage });

// Gunakan rute varian sebagai "sub-route"

// Metadata form dinamis untuk kategori -> agar frontend tau field yang wajib
router.get("/meta/form", async (req, res) => {
  try {
    const { category_id } = req.query;
    if (!category_id)
      return res.json({
        type: "marketplace",
        required: [
          "name",
          "description",
          "category_id",
          "price",
          "stock",
          "weight_gram",
        ],
      });
    const db = require("../config/database");
    const [rows] = await db.query(
      "SELECT slug, name FROM categories WHERE category_id = ?",
      [category_id]
    );
    if (rows.length === 0)
      return res.json({
        type: "marketplace",
        required: [
          "name",
          "description",
          "category_id",
          "price",
          "stock",
          "weight_gram",
        ],
      });
    const slug = (rows[0].slug || rows[0].name || "").toLowerCase();
    if (/(motor|sepeda-motor|motorcycle)/.test(slug)) {
      return res.json({
        type: "motor",
        required: [
          "name",
          "description",
          "category_id",
          "motor.brand",
          "motor.year",
          "motor.model",
          "motor.transmission",
          "motor.location",
        ],
      });
    }
    if (/(mobil|car|otomobil)/.test(slug)) {
      return res.json({
        type: "mobil",
        required: [
          "name",
          "description",
          "category_id",
          "mobil.brand",
          "mobil.model",
          "mobil.year",
          "mobil.transmission",
          "mobil.location",
        ],
      });
    }
    if (
      /(properti|property|rumah|kost|kontrakan|apartemen|apartment)/.test(slug)
    ) {
      return res.json({
        type: "property",
        required: [
          "name",
          "description",
          "category_id",
          "property.transaction_type",
          "property.price",
          "property.location",
        ],
      });
    }
    return res.json({
      type: "marketplace",
      required: [
        "name",
        "description",
        "category_id",
        "price",
        "stock",
        "weight_gram",
      ],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
});

// Rute untuk mengambil semua produk (public) dan membuat produk baru (private)
router.route("/").get(getAllProducts).post(protect, createProduct);

// Rute untuk mengambil, mengupdate, dan menghapus satu produk berdasarkan ID (atau slug)
router
  .route("/:id")
    .get(getProductById)
    .put(protect, updateProduct)
    .delete(protect, deleteProduct);

// Update status produk
router.put("/:id/status", protect, setProductStatus);

// Upload images produk (field: images[])
router.post(
  "/:id/images",
  protect,
  uploadProductImages.array("images", 10),
  addProductImages
);

module.exports = router;
