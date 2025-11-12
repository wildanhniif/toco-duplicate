const db = require('./config/database');

async function testDatabase() {
    console.log('🔍 Testing database connection and tables...');
    
    try {
        // Test connection
        const isConnected = await db.testConnection();
        if (!isConnected) {
            console.log('❌ Database connection failed');
            return;
        }
        
        // Test basic queries
        console.log('\n📊 Testing table structure...');
        
        // Check if all required tables exist
        const tables = [
            'users', 'stores', 'categories', 'products', 'product_images',
            'carts', 'cart_items', 'orders', 'order_items', 'payments', 'vouchers'
        ];
        
        for (const table of tables) {
            const [rows] = await db.query(`SHOW TABLES LIKE '${table}'`);
            if (rows.length > 0) {
                console.log(`✅ Table '${table}' exists`);
            } else {
                console.log(`❌ Table '${table}' missing`);
            }
        }
        
        // Test sample data
        console.log('\n📝 Testing sample data...');
        
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        console.log(`👥 Users: ${userCount[0].count} records`);
        
        const [storeCount] = await db.query('SELECT COUNT(*) as count FROM stores');
        console.log(`🏪 Stores: ${storeCount[0].count} records`);
        
        const [categoryCount] = await db.query('SELECT COUNT(*) as count FROM categories');
        console.log(`📂 Categories: ${categoryCount[0].count} records`);
        
        // Test foreign key relationships
        console.log('\n🔗 Testing relationships...');
        
        const [storeUsers] = await db.query(`
            SELECT u.user_id, u.full_name, s.store_id, s.name as store_name 
            FROM users u 
            LEFT JOIN stores s ON u.user_id = s.user_id 
            WHERE u.role = 'seller'
        `);
        
        console.log('🏬 Seller-Store relationships:');
        storeUsers.forEach(user => {
            if (user.store_id) {
                console.log(`  ✅ ${user.full_name} -> ${user.store_name}`);
            } else {
                console.log(`  ⚠️  ${user.full_name} has no store`);
            }
        });
        
        console.log('\n🎉 Database test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testDatabase();
