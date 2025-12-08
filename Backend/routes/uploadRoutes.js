const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { protect } = require("../middleware/authMiddleware");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary");

// Configure multer with memory storage for Cloudinary
const storage = multer.memoryStorage();

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

/**
 * @route   POST /api/upload/image
 * @desc    Upload single image
 * @access  Private
 * @query   type - folder name (products, stores, etc)
 */
router.post("/image", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const type = req.query.type || "products";
    const result = await uploadBufferToCloudinary(req.file.buffer, type);

    res.status(200).json({
      message: "Image uploaded successfully to Cloudinary",
      url: result.url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res
      .status(500)
      .json({ message: "Error uploading image", error: error.message });
  }
});

/**
 * @route   POST /api/upload/images
 * @desc    Upload multiple images
 * @access  Private
 * @query   type - folder name (products, stores, etc)
 */
router.post(
  "/images",
  protect,
  upload.array("images", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const type = req.query.type || "products";

      // Upload all files to Cloudinary
      const uploadPromises = req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, type)
      );
      const results = await Promise.all(uploadPromises);

      res.status(200).json({
        message: "Images uploaded successfully to Cloudinary",
        images: results,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res
        .status(500)
        .json({ message: "Error uploading images", error: error.message });
    }
  }
);

module.exports = router;
