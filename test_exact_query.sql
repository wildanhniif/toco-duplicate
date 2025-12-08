-- Test query EXACT seperti di backend
-- Dengan urutan parameter yang benar

-- Parameter values:
-- now = '2025-11-30 11:00:00'
-- store_id = 32
-- limit = 20
-- offset = 0

SELECT p.*, 
    (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY sort_order ASC LIMIT 1) AS image_url,
    (SELECT name FROM categories WHERE category_id = p.category_id) AS category_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM product_promotions pp 
        WHERE pp.product_id = p.product_id 
        AND pp.expires_at > '2025-11-30 11:00:00'
    ) THEN 1 ELSE 0 END AS is_promoted
FROM products p
WHERE p.store_id = 32
ORDER BY p.created_at DESC
LIMIT 20 OFFSET 0;

-- Cek apakah product_images ada
SELECT * FROM product_images WHERE product_id = 6;

-- Cek apakah categories ada
SELECT * FROM categories WHERE category_id = 2947;
