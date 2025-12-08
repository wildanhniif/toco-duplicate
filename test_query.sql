-- Test query manual untuk cek produk
-- Cek produk ada atau tidak
SELECT 
    p.product_id,
    p.name,
    p.slug,
    p.status,
    p.store_id,
    p.category_id,
    p.price,
    p.stock_quantity,
    p.created_at
FROM products p
WHERE p.store_id = 32;

-- Cek apakah store_id 32 ada di stores
SELECT store_id, user_id, name 
FROM stores 
WHERE store_id = 32;

-- Test query yang sama dengan getMyProducts (untuk status = 'all')
SELECT p.*, 
    (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY sort_order ASC LIMIT 1) AS image_url,
    (SELECT name FROM categories WHERE category_id = p.category_id) AS category_name
FROM products p
WHERE p.store_id = 32
ORDER BY p.created_at DESC
LIMIT 20 OFFSET 0;
