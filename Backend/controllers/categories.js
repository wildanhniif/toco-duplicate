const db = require("../config/database"); // Pastikan path ini benar

// Fungsi slug tetap sama
const generateSlug = (name) => {
  return name
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

// @desc    Membuat kategori baru (FIXED)
exports.createCategory = async (req, res) => {
  const { name, parent_id } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ message: "Nama kategori tidak boleh kosong" });
  }

  const slug = generateSlug(name);
  const newCategory = { name, slug, parent_id: parent_id || null };
  const sql = "INSERT INTO categories SET ?";

  let connection;
  try {
    connection = await db.getConnection(); // Dapatkan koneksi dari pool
    const [result] = await connection.query(sql, newCategory); // Gunakan 'query' untuk 'SET ?'

    res.status(201).json({
      message: "Kategori berhasil dibuat",
      category_id: result.insertId,
      ...newCategory,
    });
  } catch (error) {
    console.error("Error saat membuat kategori:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Nama kategori atau slug sudah ada." });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  } finally {
    if (connection) connection.release(); // Selalu lepaskan koneksi
  }
};

// @desc    Mendapatkan satu kategori berdasarkan ID (NEW)
exports.getCategoryById = async (req, res) => {
  const { id } = req.params;
  const sql =
    "SELECT category_id, name, slug, parent_id FROM categories WHERE category_id = ?";

  let connection;
  try {
    connection = await db.getConnection();
    const [categories] = await connection.execute(sql, [id]);

    if (categories.length === 0) {
      return res.status(404).json({ message: "Kategori tidak ditemukan" });
    }

    res.status(200).json(categories[0]);
  } catch (error) {
    console.error("Error saat mengambil kategori by ID:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  } finally {
    if (connection) connection.release();
  }
};

// @desc    Mendapatkan semua kategori (FIXED)
exports.getAllCategories = async (req, res) => {
  const sql =
    "SELECT category_id, name, slug, parent_id FROM categories ORDER BY name ASC";

  let connection;
  try {
    connection = await db.getConnection();
    const [categories] = await connection.query(sql); // 'query' juga bisa di sini
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error saat mengambil kategori:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  } finally {
    if (connection) connection.release();
  }
};

// @desc    Mengubah/update kategori (NEW)
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, parent_id } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ message: "Nama kategori tidak boleh kosong" });
  }

  const slug = generateSlug(name);
  const sql =
    "UPDATE categories SET name = ?, slug = ?, parent_id = ? WHERE category_id = ?";

  let connection;
  try {
    connection = await db.getConnection();
    const [result] = await connection.execute(sql, [
      name,
      slug,
      parent_id || null,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Kategori tidak ditemukan" });
    }

    res.status(200).json({ message: "Kategori berhasil diperbarui" });
  } catch (error) {
    console.error("Error saat update kategori:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Nama kategori atau slug sudah ada." });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  } finally {
    if (connection) connection.release();
  }
};

// @desc    Menghapus kategori (NEW)
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM categories WHERE category_id = ?";

  let connection;
  try {
    connection = await db.getConnection();
    const [result] = await connection.execute(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Kategori tidak ditemukan" });
    }

    res.status(200).json({ message: "Kategori berhasil dihapus" });
  } catch (error) {
    console.error("Error saat menghapus kategori:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  } finally {
    if (connection) connection.release();
  }
};

// @desc    Mendapatkan semua kategori dalam format pohon (NEW)
exports.getCategoryTree = async (req, res) => {
  const sql =
    "SELECT category_id, name, slug, parent_id FROM categories ORDER BY name ASC";
  let connection;

  try {
    connection = await db.getConnection();
    const [flatCategories] = await connection.query(sql);

    // Jika tidak ada kategori, kembalikan array kosong
    if (flatCategories.length === 0) {
      return res.status(200).json([]);
    }

    // --- Algoritma untuk mengubah list datar menjadi pohon ---

    // 1. Buat map untuk akses cepat ke setiap kategori berdasarkan ID-nya
    const categoryMap = {};
    flatCategories.forEach((category) => {
      category.children = []; // Tambahkan properti 'children'
      categoryMap[category.category_id] = category;
    });

    // 2. Buat array untuk menampung kategori level atas (root)
    const categoryTree = [];

    // 3. Iterasi lagi untuk menempatkan setiap kategori ke 'children' dari induknya
    flatCategories.forEach((category) => {
      if (category.parent_id !== null) {
        // Jika punya induk, cari induknya di map dan masukkan kategori ini ke sana
        const parent = categoryMap[category.parent_id];
        if (parent) {
          parent.children.push(category);
        }
      } else {
        // Jika tidak punya induk (parent_id is NULL), dia adalah root
        categoryTree.push(category);
      }
    });

    res.status(200).json(categoryTree);
  } catch (error) {
    console.error("Error saat mengambil pohon kategori:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  } finally {
    if (connection) connection.release();
  }
};

// @desc    Membuat kategori bulk (NEW)
exports.bulkCreateCategories = async (req, res) => {
  let categoriesInput = req.body;

  if (!categoriesInput) {
    return res.status(400).json({ message: "Body tidak boleh kosong" });
  }

  if (!Array.isArray(categoriesInput)) {
    categoriesInput = [categoriesInput];
  }

  let connection;

  const insertCategoryRecursive = async (category, parentId) => {
    if (!category || !category.name) {
      throw new Error("INVALID_CATEGORY_NAME");
    }

    const slug = generateSlug(category.name);
    const sql =
      "INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)";
    const [result] = await connection.execute(sql, [
      category.name,
      slug,
      parentId || null,
    ]);
    const categoryId = result.insertId;

    const childrenResult = [];

    if (category.children && Array.isArray(category.children)) {
      for (const child of category.children) {
        const childCreated = await insertCategoryRecursive(child, categoryId);
        childrenResult.push(childCreated);
      }
    }

    return {
      category_id: categoryId,
      name: category.name,
      slug,
      parent_id: parentId || null,
      children: childrenResult,
    };
  };

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const createdCategories = [];

    for (const rootCategory of categoriesInput) {
      const created = await insertCategoryRecursive(
        rootCategory,
        rootCategory.parent_id || null
      );
      createdCategories.push(created);
    }

    await connection.commit();

    res.status(201).json({
      message: "Kategori bulk berhasil dibuat",
      data: createdCategories,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error rollback transaksi kategori bulk:", rollbackError);
      }
    }

    console.error("Error saat bulk membuat kategori:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Nama kategori atau slug sudah ada." });
    }

    if (error.message === "INVALID_CATEGORY_NAME") {
      return res
        .status(400)
        .json({ message: "Setiap kategori harus memiliki nama." });
    }

    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  } finally {
    if (connection) connection.release();
  }
};
