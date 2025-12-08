const express = require("express");
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryTree,
  updateCategory,
  deleteCategory,
  bulkCreateCategories,
} = require("../controllers/categories");

// CREATE
router.post("/", createCategory);
router.post("/bulk", bulkCreateCategories);

// READ
router.get("/tree", getCategoryTree);
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// UPDATE
router.put("/:id", updateCategory);

// DELETE
router.delete("/:id", deleteCategory);

module.exports = router;
