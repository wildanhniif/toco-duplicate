ALTER TABLE products
ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0 AFTER price;
