// TEST VERSION - Hardcode values untuk debug
const getMyProducts_TEST = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  try {
    const store_id = 32; // Hardcode untuk test

    // Simple query tanpa parameter binding untuk test
    const testSql = `
      SELECT p.* 
      FROM products p
      WHERE p.store_id = 32
      ORDER BY p.created_at DESC
      LIMIT 20;
    `;

    console.log("\n=== TEST QUERY (NO PARAMS) ===");
    console.log("SQL:", testSql);

    const [products] = await db.query(testSql);

    console.log("Products found:", products.length);
    console.log("Products:", products);

    res.json({ products, total: products.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getMyProducts_TEST };
