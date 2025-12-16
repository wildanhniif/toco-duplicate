-- Performance optimization indexes for e-commerce system
-- Run these queries to improve query performance

USE toco_clone;

-- Cart items optimization
-- Used by: SELECT * FROM cart_items WHERE cart_id = ? AND is_selected = 1
CREATE INDEX IF NOT EXISTS idx_cart_items_selected 
ON cart_items(cart_id, is_selected);

-- Products optimization  
-- Used by: SELECT * FROM products WHERE store_id = ? AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_products_store_status 
ON products(store_id, status);

-- Product images optimization (already exists but verify)
-- Used by: SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order
CREATE INDEX IF NOT EXISTS idx_product_images_product_sort 
ON product_images(product_id, sort_order);

-- Orders optimization
-- Used by: SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_user_created 
ON orders(user_id, created_at DESC);

-- Voucher usage optimization
-- Used by: SELECT COUNT(*) FROM voucher_usage WHERE voucher_id = ? AND user_id = ?
CREATE INDEX IF NOT EXISTS idx_voucher_usage_voucher_user 
ON voucher_usage(voucher_id, user_id);

-- Order items optimization
-- Used by: SELECT * FROM order_items WHERE order_id = ?
CREATE INDEX IF NOT EXISTS idx_order_items_order 
ON order_items(order_id);

-- Cart shipping optimization
CREATE INDEX IF NOT EXISTS idx_cart_shipping_cart_store 
ON cart_shipping_selections(cart_id, store_id);

-- Product SKUs optimization
CREATE INDEX IF NOT EXISTS idx_product_skus_product 
ON product_skus(product_id, stock_quantity);

```

-- Analyze tables to update statistics (improves query optimizer performance)
ANALYZE TABLE cart_items;
ANALYZE TABLE products;
ANALYZE TABLE orders;
ANALYZE TABLE voucher_usage;
ANALYZE TABLE product_images;
ANALYZE TABLE order_items;
ANALYZE TABLE cart_shipping_selections;
ANALYZE TABLE product_skus;

-- Verify indexes were created successfully
SHOW INDEX FROM cart_items WHERE Key_name LIKE 'idx_%';
SHOW INDEX FROM products WHERE Key_name LIKE 'idx_%';
SHOW INDEX FROM orders WHERE Key_name LIKE 'idx_%';
