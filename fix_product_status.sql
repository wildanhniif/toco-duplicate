-- Fix NULL status to 'draft'
UPDATE products 
SET status = 'draft' 
WHERE status IS NULL;

-- Verify the fix
SELECT product_id, name, status, store_id 
FROM products 
WHERE store_id = 32;
