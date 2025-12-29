const db = require('../config/database');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
exports.getDashboardStats = async (req, res) => {
    try {
        console.log("Admin Stats Endpoint Hit");
        // 1. Total Users & Sellers
        const [userStats] = await db.query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) as total_sellers
            FROM users 
            WHERE deleted_at IS NULL
        `);

        // 2. Total Orders & Revenue (paid)
        const [orderStats] = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue
            FROM orders 
            WHERE payment_status = 'paid'
        `);

        // 3. Recent Orders
         const [recentOrders] = await db.query(`
            SELECT o.order_id, o.order_number as order_code, o.total_amount, o.status, o.created_at, u.full_name as user_name
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            ORDER BY o.created_at DESC
            LIMIT 5
        `);

        const responseData = {
            users: {
                total: userStats[0].total_users || 0,
                sellers: userStats[0].total_sellers || 0
            },
            orders: {
                total: orderStats[0].total_orders || 0,
                revenue: orderStats[0].total_revenue || 0,
                recent: recentOrders
            }
        };
        console.log("Sending Stats:", responseData);
        res.json(responseData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all users (with pagination & search)
// @route   GET /api/admin/users
// @access  Admin
exports.getAllUsers = async (req, res) => {
    const { page = 1, limit = 20, q } = req.query;
    const offset = (page - 1) * limit;

    try {
        let sql = "SELECT user_id, full_name, email, role, is_active, created_at FROM users WHERE deleted_at IS NULL";
        let countSql = "SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL";
        let params = [];

        if (q) {
            const searchClause = " AND (full_name LIKE ? OR email LIKE ?)";
            sql += searchClause;
            countSql += searchClause;
            params.push(`%${q}%`, `%${q}%`);
        }

        sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await db.query(sql, params);
        
        // Remove limit/offset params for count query
        const countParams = params.slice(0, params.length - 2);
        const [totalRows] = await db.query(countSql, countParams);

        res.json({
            users,
            total: totalRows[0].total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
         console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Ban/Unban User
// @route   PATCH /api/admin/users/:id/status
// @access  Admin
exports.updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body; // true or false

    try {
        await db.query("UPDATE users SET is_active = ? WHERE user_id = ?", [is_active ? 1 : 0, id]);
        res.json({ message: `User ${is_active ? 'activated' : 'banned'} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
