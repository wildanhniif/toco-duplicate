-- Cek produk "iphone" dan image-nya
SELECT 
    p.product_id, 
    p.name, 
    p.status,
    p.created_at,
    pi.image_id,
    pi.url as image_url,
    pi.sort_order
FROM products p
LEFT JOIN product_images pi ON p.product_id = pi.product_id
WHERE p.name LIKE '%iphone%'
ORDER BY p.product_id DESC, pi.sort_order ASC
LIMIT 10;

-- Cek berapa produk yang punya images
SELECT 
    COUNT(DISTINCT p.product_id) as total_products,
    COUNT(DISTINCT CASE WHEN pi.image_id IS NOT NULL THEN p.product_id END) as products_with_images,
    COUNT(pi.image_id) as total_images
FROM products p
LEFT JOIN product_images pi ON p.product_id = pi.product_id
WHERE p.store_id = 32;
