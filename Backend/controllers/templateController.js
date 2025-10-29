// controllers/templateController.js

const db = require('../config/database.js');

// Helper function untuk mendapatkan store_id dari user_id
const getStoreIdFromUserId = async (userId) => {
    // BENAR: db.execute() langsung dipanggil dengan parameter
    const [rows] = await db.execute("SELECT store_id FROM stores WHERE user_id = ?", [userId]);
    if (rows.length === 0) {
        throw new Error("Toko untuk user ini tidak ditemukan.");
    }
    return rows[0].store_id;
};


// MENGAMBIL SEMUA TEMPLATE
exports.getTemplates = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const storeId = await getStoreIdFromUserId(userId);

        const sql = "SELECT * FROM reply_templates WHERE store_id = ? ORDER BY display_order ASC";
        const [results] = await db.execute(sql, [storeId]);
        
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching templates:", error);
        res.status(500).json({ message: "Error server: " + error.message });
    }
};

// MEMBUAT TEMPLATE BARU
exports.createTemplate = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const storeId = await getStoreIdFromUserId(userId);
        const { content } = req.body;

        const findMaxOrderSql = "SELECT MAX(display_order) as max_order FROM reply_templates WHERE store_id = ?";
        const [result] = await db.execute(findMaxOrderSql, [storeId]);
        
        const newOrder = result[0].max_order === null ? 0 : result[0].max_order + 1;
        const insertSql = "INSERT INTO reply_templates (store_id, content, display_order) VALUES (?, ?, ?)";
        
        const [insertResult] = await db.execute(insertSql, [storeId, content, newOrder]);
        
        res.status(201).json({ message: "Template created successfully", templateId: insertResult.insertId });
    } catch (error) {
        console.error("Error creating template:", error);
        res.status(500).json({ message: "Error server: " + error.message });
    }
};

// MENGUBAH ISI TEMPLATE
exports.updateTemplate = async (req, res) => {
    const { reply_Id } = req.params;
    const { content } = req.body;
    
    try {
        const userId = req.user.user_id;
        const storeId = await getStoreIdFromUserId(userId);

        const sql = "UPDATE reply_templates SET content = ? WHERE reply_id = ? AND store_id = ?";
        const [result] = await db.execute(sql, [content, reply_Id, storeId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Template tidak ditemukan atau Anda tidak punya izin." });
        }
        res.status(200).json({ message: "Template updated successfully" });
    } catch (error) {
        console.error("Error updating template:", error);
        res.status(500).json({ message: "Error server: " + error.message });
    }
};

// MENGHAPUS TEMPLATE
exports.deleteTemplate = async (req, res) => {
    const { reply_Id } = req.params;
    
    try {
        const userId = req.user.user_id;
        const storeId = await getStoreIdFromUserId(userId);
        
        const sql = "DELETE FROM reply_templates WHERE reply_id = ? AND store_id = ?";
        const [result] = await db.execute(sql, [reply_Id, storeId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Template tidak ditemukan atau Anda tidak punya izin." });
        }
        res.status(200).json({ message: "Template deleted successfully" });
    } catch (error) {
        console.error("Error deleting template:", error);
        res.status(500).json({ message: "Error server: " + error.message });
    }
};


// MENGUBAH URUTAN TEMPLATE
exports.updateTemplatesOrder = async (req, res) => {
    const { templates } = req.body;

    if (!templates || !Array.isArray(templates)) {
        return res.status(400).json({ message: "Format data tidak valid." });
    }

    let connection; // Definisikan di luar try-catch agar bisa diakses di finally
    try {
        const userId = req.user.user_id;
        const storeId = await getStoreIdFromUserId(userId);

        // BENAR: Mendapatkan koneksi dari pool
        connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const templateIds = templates.map(t => t.reply_id);
            const [ownedTemplates] = await connection.execute(
                `SELECT reply_id FROM reply_templates WHERE reply_id IN (?) AND store_id = ?`,
                [templateIds, storeId]
            );

            if (ownedTemplates.length !== templateIds.length) {
                await connection.rollback();
                return res.status(403).json({ message: "Error: Ada template yang bukan milik Anda." });
            }

            const queries = templates.map(t => 
                connection.execute("UPDATE reply_templates SET display_order = ? WHERE reply_id = ?", [t.order, t.reply_id])
            );
            
            // BENAR: Menggunakan Promise.all untuk menjalankan semua query secara paralel
            await Promise.all(queries);
            
            await connection.commit();
            res.status(200).json({ message: "Urutan template berhasil diperbarui" });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (err) {
        res.status(500).json({ message: "Database error saat update urutan", error: err.message });
    } finally {
        // BENAR: Selalu lepaskan koneksi setelah selesai
        if (connection) connection.release();
    }
};