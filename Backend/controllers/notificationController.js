const db = require("../config/database");

/**
 * @desc    Get notifications for current user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { limit = 20, offset = 0 } = req.query;

    const [notifications] = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    // Get unread count
    const [countResult] = await db.query(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
      [userId]
    );

    res.json({
      notifications,
      unread_count: countResult[0].count,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const [result] = await db.query(
      "UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;

    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
      [userId]
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Create notification (internal use)
 * @param   {Object} data - {user_id, type, title, message, link}
 */
const createNotification = async (data) => {
  const { user_id, type, title, message, link } = data;

  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link) 
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, type, title, message, link || null]
    );
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
};
