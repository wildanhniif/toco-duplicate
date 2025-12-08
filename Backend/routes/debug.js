const express = require("express");
const router = express.Router();
const db = require("../config/database");

// Debug endpoint to check user state
router.get("/user/:userId", async (req, res) => {
  try {
    const connection = await db.getConnection();

    const [users] = await connection.execute(
      "SELECT user_id, full_name, email, role, google_id FROM users WHERE user_id = ?",
      [req.params.userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Check if user has store
    const [stores] = await connection.execute(
      "SELECT store_id, name, is_active FROM stores WHERE user_id = ?",
      [req.params.userId]
    );

    connection.release();

    res.json({
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      google_id: user.google_id,
      has_store: stores.length > 0,
      store: stores.length > 0 ? stores[0] : null,
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
