-- Create database if not exists
CREATE DATABASE IF NOT EXISTS toco_clone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE toco_clone;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS payment_notifications;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS voucher_usages;
DROP TABLE IF EXISTS voucher_products;
DROP TABLE IF EXISTS vouchers;
DROP TABLE IF EXISTS vehicle_motor_specs;
DROP TABLE IF EXISTS vehicle_mobil_specs;
DROP TABLE IF EXISTS property_specs;
DROP TABLE IF EXISTS order_status_logs;
DROP TABLE IF EXISTS order_shipping;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_sku_options;
DROP TABLE IF EXISTS product_skus;
DROP TABLE IF EXISTS product_variant_attribute_options;
DROP TABLE IF EXISTS product_variant_attributes;
DROP TABLE IF EXISTS product_promotions;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS cart_vouchers;
DROP TABLE IF EXISTS cart_shipping_selections;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS store_selected_services;
DROP TABLE IF EXISTS store_courier_weight_rates;
DROP TABLE IF EXISTS store_courier_distance_rates;
DROP TABLE IF EXISTS store_courier_settings;
DROP TABLE IF EXISTS store_about_pages;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS reply_templates;
DROP TABLE IF EXISTS user_addresses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS courier_services;
DROP TABLE IF EXISTS couriers;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- Core Tables (no dependencies)
-- --------------------------------------------------------

-- Users table
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','seller','admin') NOT NULL DEFAULT 'user',
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `google_id` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  `gender` enum('L','P') DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_users_phone` (`phone_number`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_verified` (`is_verified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table
CREATE TABLE `categories` (
  `category_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id` int(10) UNSIGNED DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uk_categories_slug` (`slug`),
  KEY `fk_categories_parent` (`parent_id`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Couriers table
CREATE TABLE `couriers` (
  `courier_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`courier_id`),
  UNIQUE KEY `uk_couriers_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Courier Services table
CREATE TABLE `courier_services` (
  `service_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `courier_id` int(10) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `service_type` enum('reguler','express','economy','same_day') DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`service_id`),
  UNIQUE KEY `uk_courier_services_code` (`code`),
  KEY `fk_courier_services_courier` (`courier_id`),
  CONSTRAINT `fk_courier_services_courier` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`courier_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Store Related Tables
-- --------------------------------------------------------

-- Stores table
CREATE TABLE `stores` (
  `store_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `banner_url` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `rating_avg` decimal(3,2) NOT NULL DEFAULT 0.00,
  `review_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`store_id`),
  UNIQUE KEY `uk_stores_slug` (`slug`),
  UNIQUE KEY `uk_stores_user` (`user_id`),
  KEY `idx_stores_active` (`is_active`),
  CONSTRAINT `fk_stores_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Addresses table
CREATE TABLE `user_addresses` (
  `userAddress_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `label` varchar(50) NOT NULL,
  `recipient_name` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `map_address` text DEFAULT NULL,
  `address_detail` text DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `province` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `district` varchar(100) DEFAULT NULL,
  `subdistrict` varchar(100) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`userAddress_id`),
  KEY `fk_user_addresses_user` (`user_id`),
  CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Store About Pages table
CREATE TABLE `store_about_pages` (
  `about_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_id` int(10) UNSIGNED NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`about_id`),
  UNIQUE KEY `uk_store_about` (`store_id`),
  CONSTRAINT `fk_store_about_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reply Templates table
CREATE TABLE `reply_templates` (
  `reply_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`reply_id`),
  KEY `fk_reply_templates_store` (`store_id`),
  CONSTRAINT `fk_reply_templates_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Product Related Tables
-- --------------------------------------------------------

-- Products table
CREATE TABLE `products` (
  `product_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `product_classification` enum('marketplace','classified') NOT NULL DEFAULT 'marketplace',
  `price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `sku` varchar(100) DEFAULT NULL,
  `condition` enum('new','used') NOT NULL DEFAULT 'new',
  `brand` varchar(100) DEFAULT NULL,
  `weight_gram` int(10) UNSIGNED DEFAULT NULL,
  `dimensions` json DEFAULT NULL,
  `is_preorder` tinyint(1) NOT NULL DEFAULT 0,
  `preorder_days` int(11) DEFAULT NULL,
  `use_store_courier` tinyint(1) NOT NULL DEFAULT 1,
  `insurance` enum('wajib','opsional','tidak') NOT NULL DEFAULT 'opsional',
  `status` enum('active','inactive','draft','banned') NOT NULL DEFAULT 'inactive',
  `view_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `review_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `rating_avg` decimal(3,2) NOT NULL DEFAULT 0.00,
  `sold_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `uk_products_slug` (`slug`),
  UNIQUE KEY `uk_products_store_sku` (`store_id`,`sku`),
  KEY `fk_products_store` (`store_id`),
  KEY `fk_products_category` (`category_id`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_classification` (`product_classification`),
  KEY `idx_products_active` (`status`, `store_id`),
  CONSTRAINT `fk_products_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Images table
CREATE TABLE `product_images` (
  `image_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `url` varchar(255) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`image_id`),
  KEY `fk_product_images_product` (`product_id`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Variant Attributes table
CREATE TABLE `product_variant_attributes` (
  `attribute_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `attribute_name` varchar(100) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`attribute_id`),
  KEY `fk_product_variant_attributes_product` (`product_id`),
  CONSTRAINT `fk_product_variant_attributes_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Variant Attribute Options table
CREATE TABLE `product_variant_attribute_options` (
  `option_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `attribute_id` int(10) UNSIGNED NOT NULL,
  `option_value` varchar(100) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`option_id`),
  KEY `fk_product_variant_attribute_options_attribute` (`attribute_id`),
  CONSTRAINT `fk_product_variant_attribute_options_attribute` FOREIGN KEY (`attribute_id`) REFERENCES `product_variant_attributes` (`attribute_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product SKUs table
CREATE TABLE `product_skus` (
  `product_sku_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `sku_code` varchar(100) NOT NULL,
  `price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `weight_gram` int(10) UNSIGNED DEFAULT NULL,
  `dimensions` json DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`product_sku_id`),
  UNIQUE KEY `uk_product_skus_code` (`product_id`,`sku_code`),
  KEY `fk_product_skus_product` (`product_id`),
  CONSTRAINT `fk_product_skus_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product SKU Options table
CREATE TABLE `product_sku_options` (
  `product_sku_option_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_sku_id` bigint(20) UNSIGNED NOT NULL,
  `option_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`product_sku_option_id`),
  KEY `fk_product_sku_options_sku` (`product_sku_id`),
  KEY `fk_product_sku_options_option` (`option_id`),
  CONSTRAINT `fk_product_sku_options_sku` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`product_sku_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_sku_options_option` FOREIGN KEY (`option_id`) REFERENCES `product_variant_attribute_options` (`option_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Promotions table
CREATE TABLE `product_promotions` (
  `promotion_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL,
  `promotion_type` enum('featured','discount','flash_sale') NOT NULL DEFAULT 'featured',
  `discount_percentage` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`promotion_id`),
  KEY `fk_product_promotions_product` (`product_id`),
  KEY `fk_product_promotions_store` (`store_id`),
  KEY `idx_product_promotions_expires` (`expires_at`),
  CONSTRAINT `fk_product_promotions_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_promotions_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Specialized Product Specs
-- --------------------------------------------------------

-- Vehicle Motor Specs table
CREATE TABLE `vehicle_motor_specs` (
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `brand` varchar(50) NOT NULL,
  `year` int(4) NOT NULL,
  `model` varchar(100) NOT NULL,
  `transmission` enum('manual','automatic') NOT NULL,
  `mileage_km` int(10) UNSIGNED DEFAULT NULL,
  `engine_cc` int(10) UNSIGNED DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `fuel` enum('bensin','electric') DEFAULT NULL,
  `tax_expiry_date` date DEFAULT NULL,
  `completeness_text` text DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`product_id`),
  CONSTRAINT `fk_vehicle_motor_specs_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicle Mobil Specs table
CREATE TABLE `vehicle_mobil_specs` (
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `brand` varchar(50) NOT NULL,
  `model` varchar(100) NOT NULL,
  `year` int(4) NOT NULL,
  `transmission` enum('manual','automatic','cvt') NOT NULL,
  `mileage_km` int(10) UNSIGNED DEFAULT NULL,
  `license_plate` varchar(15) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `fuel` enum('bensin','diesel','hybrid','electric') DEFAULT NULL,
  `engine_cc` int(10) UNSIGNED DEFAULT NULL,
  `seat_count` int(11) DEFAULT NULL,
  `tax_expiry_date` date DEFAULT NULL,
  `completeness_text` text DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`product_id`),
  CONSTRAINT `fk_vehicle_mobil_specs_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property Specs table
CREATE TABLE `property_specs` (
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `transaction_type` enum('jual','sewa') NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `building_area_m2` int(10) UNSIGNED DEFAULT NULL,
  `land_area_m2` int(10) UNSIGNED DEFAULT NULL,
  `bedrooms` int(11) DEFAULT NULL,
  `bathrooms` int(11) DEFAULT NULL,
  `floors` int(11) DEFAULT NULL,
  `certificate_text` varchar(100) DEFAULT NULL,
  `facilities_text` text DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`product_id`),
  CONSTRAINT `fk_property_specs_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Cart Related Tables
-- --------------------------------------------------------

-- Carts table
CREATE TABLE `carts` (
  `cart_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `selected_address_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`cart_id`),
  UNIQUE KEY `uk_carts_user` (`user_id`),
  KEY `fk_carts_address` (`selected_address_id`),
  CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_carts_address` FOREIGN KEY (`selected_address_id`) REFERENCES `user_addresses` (`userAddress_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart Items table
CREATE TABLE `cart_items` (
  `cart_item_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `product_sku_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_name_snapshot` varchar(255) NOT NULL,
  `variant_snapshot` varchar(255) DEFAULT NULL,
  `image_url_snapshot` varchar(255) DEFAULT NULL,
  `unit_price_snapshot` decimal(15,2) NOT NULL,
  `weight_gram_snapshot` int(10) UNSIGNED DEFAULT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `selected` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`cart_item_id`),
  KEY `fk_cart_items_cart` (`cart_id`),
  KEY `fk_cart_items_store` (`store_id`),
  KEY `fk_cart_items_product` (`product_id`),
  KEY `fk_cart_items_sku` (`product_sku_id`),
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_sku` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`product_sku_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart Shipping Selections table
CREATE TABLE `cart_shipping_selections` (
  `selection_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `courier_code` varchar(50) NOT NULL,
  `service_code` varchar(50) NOT NULL,
  `service_name` varchar(100) DEFAULT NULL,
  `etd_min_days` int(11) DEFAULT NULL,
  `etd_max_days` int(11) DEFAULT NULL,
  `delivery_fee` decimal(15,2) NOT NULL DEFAULT 0.00,
  `note` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`selection_id`),
  UNIQUE KEY `uk_cart_shipping_selections` (`cart_id`,`store_id`),
  CONSTRAINT `fk_cart_shipping_selections_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_shipping_selections_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart Vouchers table
CREATE TABLE `cart_vouchers` (
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `voucher_code` varchar(50) NOT NULL,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `voucher_id` bigint(20) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`cart_id`),
  CONSTRAINT `fk_cart_vouchers_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Order Related Tables
-- --------------------------------------------------------

-- Orders table
CREATE TABLE `orders` (
  `order_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `status` enum('pending','payment_pending','paid','processing','shipped','delivered','cancelled','returned') NOT NULL DEFAULT 'pending',
  `payment_status` enum('unpaid','paid','refunded','partial_refund') NOT NULL DEFAULT 'unpaid',
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `shipping_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `voucher_discount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(3) NOT NULL DEFAULT 'IDR',
  `notes` text DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `uk_orders_number` (`order_number`),
  KEY `fk_orders_user` (`user_id`),
  KEY `fk_orders_store` (`store_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_created` (`created_at`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items table
CREATE TABLE `order_items` (
  `order_item_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `product_sku_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_name_snapshot` varchar(255) NOT NULL,
  `variant_snapshot` varchar(255) DEFAULT NULL,
  `image_url_snapshot` varchar(255) DEFAULT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `weight_gram` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`order_item_id`),
  KEY `fk_order_items_order` (`order_id`),
  KEY `fk_order_items_product` (`product_id`),
  KEY `fk_order_items_sku` (`product_sku_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_sku` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`product_sku_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Shipping table
CREATE TABLE `order_shipping` (
  `shipping_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `courier_code` varchar(50) NOT NULL,
  `service_code` varchar(50) NOT NULL,
  `service_name` varchar(100) DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `etd_min_days` int(11) DEFAULT NULL,
  `etd_max_days` int(11) DEFAULT NULL,
  `shipping_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `recipient_name` varchar(100) NOT NULL,
  `recipient_phone` varchar(20) NOT NULL,
  `recipient_address` text NOT NULL,
  `recipient_province` varchar(100) NOT NULL,
  `recipient_city` varchar(100) NOT NULL,
  `recipient_postal_code` varchar(10) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`shipping_id`),
  UNIQUE KEY `uk_order_shipping_order` (`order_id`),
  CONSTRAINT `fk_order_shipping_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Status Logs table
CREATE TABLE `order_status_logs` (
  `log_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('pending','payment_pending','paid','processing','shipped','delivered','cancelled','returned') NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `fk_order_status_logs_order` (`order_id`),
  CONSTRAINT `fk_order_status_logs_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Payment Related Tables
-- --------------------------------------------------------

-- Payments table for tracking payment transactions
CREATE TABLE `payments` (
  `payment_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `payment_code` varchar(100) DEFAULT NULL,
  `provider` enum('midtrans','manual','bank_transfer','ewallet') NOT NULL DEFAULT 'midtrans',
  `payment_type` varchar(50) DEFAULT NULL,
  `payment_status` enum('pending','processing','success','failed','expired','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `gross_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(3) NOT NULL DEFAULT 'IDR',
  `transaction_id` varchar(100) DEFAULT NULL,
  `transaction_time` timestamp NULL DEFAULT NULL,
  `expiry_time` timestamp NULL DEFAULT NULL,
  `payment_amount` decimal(15,2) DEFAULT NULL,
  `bank` varchar(50) DEFAULT NULL,
  `va_number` varchar(50) DEFAULT NULL,
  `bill_key` varchar(50) DEFAULT NULL,
  `biller_code` varchar(50) DEFAULT NULL,
  `qr_code` text DEFAULT NULL,
  `callback_url` varchar(255) DEFAULT NULL,
  `redirect_url` varchar(255) DEFAULT NULL,
  `raw_response` json DEFAULT NULL,
  `fraud_status` varchar(20) DEFAULT NULL,
  `status_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uk_payments_order` (`order_id`),
  KEY `idx_payments_status` (`payment_status`),
  KEY `idx_payments_provider` (`provider`),
  KEY `idx_payments_transaction` (`transaction_id`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Notifications table for webhook tracking
CREATE TABLE `payment_notifications` (
  `notification_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `order_id` varchar(50) DEFAULT NULL,
  `transaction_status` varchar(50) DEFAULT NULL,
  `fraud_status` varchar(20) DEFAULT NULL,
  `status_code` varchar(10) DEFAULT NULL,
  `signature_key` varchar(255) DEFAULT NULL,
  `raw_payload` json DEFAULT NULL,
  `processed` tinyint(1) NOT NULL DEFAULT 0,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`),
  KEY `fk_payment_notifications_payment` (`payment_id`),
  KEY `idx_payment_notifications_order` (`order_id`),
  KEY `idx_payment_notifications_processed` (`processed`),
  CONSTRAINT `fk_payment_notifications_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Voucher Related Tables
-- --------------------------------------------------------

-- Vouchers table
CREATE TABLE `vouchers` (
  `voucher_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_id` int(10) UNSIGNED DEFAULT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('fixed','percentage') NOT NULL DEFAULT 'fixed',
  `value` decimal(15,2) NOT NULL,
  `min_purchase` decimal(15,2) NOT NULL DEFAULT 0.00,
  `max_discount` decimal(15,2) DEFAULT NULL,
  `usage_limit` int(10) UNSIGNED DEFAULT NULL,
  `usage_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `user_limit` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `start_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `end_at` timestamp NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`voucher_id`),
  UNIQUE KEY `uk_vouchers_code` (`code`),
  KEY `fk_vouchers_store` (`store_id`),
  KEY `idx_vouchers_active_period` (`is_active`, `start_at`, `end_at`),
  CONSTRAINT `fk_vouchers_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Voucher Products table
CREATE TABLE `voucher_products` (
  `voucher_product_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `voucher_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`voucher_product_id`),
  UNIQUE KEY `uk_voucher_products` (`voucher_id`,`product_id`),
  KEY `fk_voucher_products_voucher` (`voucher_id`),
  KEY `fk_voucher_products_product` (`product_id`),
  CONSTRAINT `fk_voucher_products_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_voucher_products_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Voucher Usages table
CREATE TABLE `voucher_usages` (
  `usage_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `voucher_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`usage_id`),
  UNIQUE KEY `uk_voucher_usages_order` (`voucher_id`,`order_id`),
  KEY `fk_voucher_usages_voucher` (`voucher_id`),
  KEY `fk_voucher_usages_user` (`user_id`),
  KEY `fk_voucher_usages_order` (`order_id`),
  CONSTRAINT `fk_voucher_usages_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_voucher_usages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_voucher_usages_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Sample Data (Minimal)
-- --------------------------------------------------------

-- Insert sample categories
INSERT INTO `categories` (`category_id`, `name`, `slug`, `description`) VALUES
(1, 'Elektronik', 'elektronik', 'Produk elektronik dan gadget'),
(2, 'Fashion', 'fashion', 'Pakaian dan aksesoris'),
(3, 'Motor', 'motor', 'Sepeda motor dan aksesoris'),
(4, 'Mobil', 'mobil', 'Mobil dan aksesoris'),
(5, 'Properti', 'properti', 'Rumah, apartemen, dan tanah');

-- Insert sample users
INSERT INTO `users` (`user_id`, `full_name`, `phone_number`, `email`, `password`, `role`, `is_verified`, `gender`, `birth_date`) VALUES
(6, 'Wildan Hanif', '085346912387', 'dannif@example.com', '$2b$10$Zew98lNQ/fTaWFOA00XiU.VPdykr1kKoip7c9DcgnWrw.rGJhG80G', 'seller', 1, 'L', '2004-08-17'),
(8, 'Budi Santoso', '081234567890', 'budi@example.com', '$2b$10$9f8KhYFxs7UWafbUl/n7FOl3XJFK256CfZ4AFLAGA.kJL/J2o2J76', 'seller', 1, NULL, NULL),
(12, 'Admin User', '089572583562', 'admin@gmail.com', '$2b$10$onHHT4sJUb5cDTATBVtipuV4sIMJgTt4mjZDSRfo6/2T0RsEiXjBi', 'admin', 1, NULL, NULL);

-- Insert sample stores
INSERT INTO `stores` (`store_id`, `user_id`, `name`, `slug`, `description`, `is_active`) VALUES
(1, 6, 'Toko Wildan', 'toko-wildan', 'Toko elektronik terpercaya', 1),
(2, 8, 'Budi Store', 'budi-store', 'Fashion dan aksesoris', 1);

-- Insert sample addresses
INSERT INTO `user_addresses` (`userAddress_id`, `user_id`, `label`, `recipient_name`, `phone_number`, `province`, `city`, `address_detail`, `postal_code`, `is_default`) VALUES
(1, 6, 'Rumah', 'Wildan Hanif', '085346912387', 'Jawa Barat', 'Bandung', 'Jl. Sudirman No. 123', '40111', 1);

-- Insert sample cart
INSERT INTO `carts` (`cart_id`, `user_id`, `selected_address_id`) VALUES
(1, 6, 1);

COMMIT;
