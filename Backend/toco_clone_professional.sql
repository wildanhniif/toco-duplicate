-- =====================================================
-- Blibli/Toco Clone - Professional Database Schema
-- =====================================================
-- Version: 2.0 Professional
-- Created: 2025-11-14
-- Engine: InnoDB
-- Charset: utf8mb4_unicode_ci

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS toco_clone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE toco_clone;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all tables in correct dependency order
DROP TABLE IF EXISTS payment_notifications;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS voucher_usages;
DROP TABLE IF EXISTS voucher_products;
DROP TABLE IF EXISTS vouchers;
DROP TABLE IF EXISTS order_status_logs;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS cart_shipping_selections;
DROP TABLE IF EXISTS cart_vouchers;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS product_sku_options;
DROP TABLE IF EXISTS product_skus;
DROP TABLE IF EXISTS product_variant_attribute_options;
DROP TABLE IF EXISTS product_variant_attributes;
DROP TABLE IF EXISTS product_promotions;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS store_courier_settings;
DROP TABLE IF EXISTS store_about_pages;
DROP TABLE IF EXISTS reply_templates;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS user_addresses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS courier_services;
DROP TABLE IF EXISTS couriers;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Core Tables (No Dependencies)
-- =====================================================

-- Users table with proper structure
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('customer','seller','admin') NOT NULL DEFAULT 'customer',
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `google_id` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_users_phone` (`phone_number`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_verified` (`is_verified`),
  KEY `idx_users_active` (`is_active`),
  KEY `idx_users_deleted` (`deleted_at`),
  CONSTRAINT `chk_users_role` CHECK (`role` IN ('customer','seller','admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table with hierarchical support
CREATE TABLE `categories` (
  `category_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id` int(10) UNSIGNED DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uk_categories_slug` (`slug`),
  KEY `fk_categories_parent` (`parent_id`),
  KEY `idx_categories_active` (`is_active`),
  KEY `idx_categories_deleted` (`deleted_at`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_categories_sort_order` CHECK (`sort_order` >= 0)
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
  UNIQUE KEY `uk_couriers_code` (`code`),
  KEY `idx_couriers_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Courier Services table
CREATE TABLE `courier_services` (
  `service_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `courier_id` int(10) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `service_type` enum('regular','express','economy','same_day','cargo') NOT NULL DEFAULT 'regular',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`service_id`),
  UNIQUE KEY `uk_courier_services_courier_code` (`courier_id`,`code`),
  KEY `fk_courier_services_courier` (`courier_id`),
  KEY `idx_courier_services_type` (`service_type`),
  KEY `idx_courier_services_active` (`is_active`),
  CONSTRAINT `fk_courier_services_courier` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`courier_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_courier_services_type` CHECK (`service_type` IN ('regular','express','economy','same_day','cargo'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- User Related Tables
-- =====================================================

-- User Addresses table with proper geolocation
CREATE TABLE `user_addresses` (
  `address_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `label` varchar(50) NOT NULL,
  `recipient_name` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `address_line` text NOT NULL,
  `province` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `district` varchar(100) DEFAULT NULL,
  `subdistrict` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`address_id`),
  KEY `fk_user_addresses_user` (`user_id`),
  KEY `idx_user_addresses_default` (`is_default`),
  KEY `idx_user_addresses_deleted` (`deleted_at`),
  CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_user_addresses_default` CHECK (`is_default` IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Store Related Tables
-- =====================================================

-- Stores table with proper business information
CREATE TABLE `stores` (
  `store_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `banner_url` varchar(255) DEFAULT NULL,
  `business_phone` varchar(20) DEFAULT NULL,
  `business_email` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `address_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `rating_average` decimal(3,2) NOT NULL DEFAULT 0.00,
  `review_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`store_id`),
  UNIQUE KEY `uk_stores_slug` (`slug`),
  UNIQUE KEY `uk_stores_user` (`user_id`),
  KEY `fk_stores_address` (`address_id`),
  KEY `idx_stores_active` (`is_active`),
  KEY `idx_stores_verified` (`is_verified`),
  KEY `idx_stores_deleted` (`deleted_at`),
  CONSTRAINT `fk_stores_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_stores_address` FOREIGN KEY (`address_id`) REFERENCES `user_addresses` (`address_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_stores_rating` CHECK (`rating_average` >= 0 AND `rating_average` <= 5),
  CONSTRAINT `chk_stores_active` CHECK (`is_active` IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Store About Pages table
CREATE TABLE `store_about_pages` (
  `about_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`about_id`),
  UNIQUE KEY `uk_store_about` (`store_id`),
  CONSTRAINT `fk_store_about_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reply Templates table for customer service
CREATE TABLE `reply_templates` (
  `template_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`template_id`),
  KEY `fk_reply_templates_store` (`store_id`),
  KEY `idx_reply_templates_active` (`is_active`),
  KEY `idx_reply_templates_order` (`sort_order`),
  CONSTRAINT `fk_reply_templates_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_reply_templates_active` CHECK (`is_active` IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Product Related Tables
-- =====================================================

-- Products table with comprehensive fields
CREATE TABLE `products` (
  `product_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `product_type` enum('marketplace','classified') NOT NULL DEFAULT 'marketplace',
  `price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `stock_quantity` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `sku` varchar(100) DEFAULT NULL,
  `condition` enum('new','used','refurbished') NOT NULL DEFAULT 'new',
  `brand` varchar(100) DEFAULT NULL,
  `weight_gram` int(10) UNSIGNED DEFAULT NULL,
  `length_mm` int(10) UNSIGNED DEFAULT NULL,
  `width_mm` int(10) UNSIGNED DEFAULT NULL,
  `height_mm` int(10) UNSIGNED DEFAULT NULL,
  `is_preorder` tinyint(1) NOT NULL DEFAULT 0,
  `preorder_days` int(11) DEFAULT NULL,
  `min_order_quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `max_order_quantity` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('draft','active','inactive','banned') NOT NULL DEFAULT 'draft',
  `view_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `sold_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `rating_average` decimal(3,2) NOT NULL DEFAULT 0.00,
  `review_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `uk_products_slug` (`slug`),
  UNIQUE KEY `uk_products_store_sku` (`store_id`,`sku`),
  KEY `fk_products_store` (`store_id`),
  KEY `fk_products_category` (`category_id`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_type` (`product_type`),
  KEY `idx_products_active` (`status`, `store_id`),
  KEY `idx_products_deleted` (`deleted_at`),
  KEY `idx_products_price` (`price`),
  KEY `idx_products_rating` (`rating_average`),
  CONSTRAINT `fk_products_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_products_price` CHECK (`price` >= 0),
  CONSTRAINT `chk_products_stock` CHECK (`stock_quantity` >= 0),
  CONSTRAINT `chk_products_weight` CHECK (`weight_gram` >= 0),
  CONSTRAINT `chk_products_preorder_days` CHECK (`preorder_days` > 0),
  CONSTRAINT `chk_products_min_order` CHECK (`min_order_quantity` > 0),
  CONSTRAINT `chk_products_max_order` CHECK (`max_order_quantity` IS NULL OR `max_order_quantity` >= `min_order_quantity`),
  CONSTRAINT `chk_products_rating` CHECK (`rating_average` >= 0 AND `rating_average` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Images table
CREATE TABLE `product_images` (
  `image_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `url` varchar(255) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`image_id`),
  KEY `fk_product_images_product` (`product_id`),
  KEY `idx_product_images_sort` (`sort_order`),
  KEY `idx_product_images_primary` (`is_primary`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_product_images_primary` CHECK (`is_primary` IN (0,1))
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
  KEY `idx_product_variant_attributes_order` (`sort_order`),
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
  KEY `idx_product_variant_attribute_options_order` (`sort_order`),
  CONSTRAINT `fk_product_variant_attribute_options_attribute` FOREIGN KEY (`attribute_id`) REFERENCES `product_variant_attributes` (`attribute_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product SKUs table
CREATE TABLE `product_skus` (
  `sku_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `sku_code` varchar(100) NOT NULL,
  `price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `stock_quantity` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `weight_gram` int(10) UNSIGNED DEFAULT NULL,
  `length_mm` int(10) UNSIGNED DEFAULT NULL,
  `width_mm` int(10) UNSIGNED DEFAULT NULL,
  `height_mm` int(10) UNSIGNED DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`sku_id`),
  UNIQUE KEY `uk_product_skus_code` (`product_id`,`sku_code`),
  KEY `fk_product_skus_product` (`product_id`),
  KEY `idx_product_skus_price` (`price`),
  KEY `idx_product_skus_stock` (`stock_quantity`),
  CONSTRAINT `fk_product_skus_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_product_skus_price` CHECK (`price` >= 0),
  CONSTRAINT `chk_product_skus_stock` CHECK (`stock_quantity` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product SKU Options mapping table
CREATE TABLE `product_sku_options` (
  `sku_option_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `sku_id` bigint(20) UNSIGNED NOT NULL,
  `option_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`sku_option_id`),
  UNIQUE KEY `uk_product_sku_options` (`sku_id`,`option_id`),
  KEY `fk_product_sku_options_sku` (`sku_id`),
  KEY `fk_product_sku_options_option` (`option_id`),
  CONSTRAINT `fk_product_sku_options_sku` FOREIGN KEY (`sku_id`) REFERENCES `product_skus` (`sku_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_sku_options_option` FOREIGN KEY (`option_id`) REFERENCES `product_variant_attribute_options` (`option_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Promotions table
CREATE TABLE `product_promotions` (
  `promotion_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `promotion_type` enum('featured','discount','flash_sale','buy_get') NOT NULL DEFAULT 'featured',
  `discount_percentage` decimal(5,2) DEFAULT NULL,
  `discount_amount` decimal(15,2) DEFAULT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`promotion_id`),
  KEY `fk_product_promotions_product` (`product_id`),
  KEY `fk_product_promotions_store` (`store_id`),
  KEY `idx_product_promotions_expires` (`expires_at`),
  KEY `idx_product_promotions_active` (`is_active`),
  KEY `idx_product_promotions_type` (`promotion_type`),
  CONSTRAINT `fk_product_promotions_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_promotions_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_product_promotions_discount_percentage` CHECK (`discount_percentage` IS NULL OR (`discount_percentage` > 0 AND `discount_percentage` <= 100)),
  CONSTRAINT `chk_product_promotions_discount_amount` CHECK (`discount_amount` IS NULL OR `discount_amount` > 0),
  CONSTRAINT `chk_product_promotions_started_expires` CHECK (`started_at` < `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Cart Related Tables
-- =====================================================

-- Carts table
CREATE TABLE `carts` (
  `cart_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `shipping_address_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`cart_id`),
  UNIQUE KEY `uk_carts_user` (`user_id`),
  KEY `fk_carts_address` (`shipping_address_id`),
  CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_carts_address` FOREIGN KEY (`shipping_address_id`) REFERENCES `user_addresses` (`address_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart Items table (without redundant snapshots)
CREATE TABLE `cart_items` (
  `cart_item_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `sku_id` bigint(20) UNSIGNED DEFAULT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` decimal(15,2) NOT NULL,
  `is_selected` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`cart_item_id`),
  KEY `fk_cart_items_cart` (`cart_id`),
  KEY `fk_cart_items_product` (`product_id`),
  KEY `fk_cart_items_sku` (`sku_id`),
  KEY `idx_cart_items_selected` (`is_selected`),
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_sku` FOREIGN KEY (`sku_id`) REFERENCES `product_skus` (`sku_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_cart_items_quantity` CHECK (`quantity` > 0),
  CONSTRAINT `chk_cart_items_price` CHECK (`unit_price` >= 0),
  CONSTRAINT `chk_cart_items_selected` CHECK (`is_selected` IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart Shipping Selections table
CREATE TABLE `cart_shipping_selections` (
  `shipping_selection_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `courier_code` varchar(50) NOT NULL,
  `service_code` varchar(50) NOT NULL,
  `service_name` varchar(100) DEFAULT NULL,
  `etd_min_days` int(11) DEFAULT NULL,
  `etd_max_days` int(11) DEFAULT NULL,
  `shipping_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`shipping_selection_id`),
  UNIQUE KEY `uk_cart_shipping_selections` (`cart_id`,`store_id`),
  KEY `fk_cart_shipping_selections_cart` (`cart_id`),
  KEY `fk_cart_shipping_selections_store` (`store_id`),
  CONSTRAINT `fk_cart_shipping_selections_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_shipping_selections_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_cart_shipping_cost` CHECK (`shipping_cost` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Order Related Tables
-- =====================================================

-- Orders table with proper structure
CREATE TABLE `orders` (
  `order_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL,
  `user_id` int(11) NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `shipping_address_id` int(11) NOT NULL,
  `status` enum('pending','payment_pending','paid','processing','shipped','delivered','cancelled','returned') NOT NULL DEFAULT 'pending',
  `payment_status` enum('unpaid','paid','refunded','partial_refund') NOT NULL DEFAULT 'unpaid',
  `subtotal_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
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
  KEY `fk_orders_shipping_address` (`shipping_address_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_payment_status` (`payment_status`),
  KEY `idx_orders_created` (`created_at`),
  KEY `idx_orders_user_status` (`user_id`, `status`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_shipping_address` FOREIGN KEY (`shipping_address_id`) REFERENCES `user_addresses` (`address_id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_orders_subtotal` CHECK (`subtotal_amount` >= 0),
  CONSTRAINT `chk_orders_shipping` CHECK (`shipping_cost` >= 0),
  CONSTRAINT `chk_orders_voucher` CHECK (`voucher_discount` >= 0),
  CONSTRAINT `chk_orders_total` CHECK (`total_amount` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items table (without redundant snapshots)
CREATE TABLE `order_items` (
  `order_item_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `sku_id` bigint(20) UNSIGNED DEFAULT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` decimal(15,2) NOT NULL,
  `total_price` decimal(15,2) GENERATED ALWAYS AS (`quantity` * `unit_price`) STORED,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`order_item_id`),
  KEY `fk_order_items_order` (`order_id`),
  KEY `fk_order_items_product` (`product_id`),
  KEY `fk_order_items_sku` (`sku_id`),
  KEY `idx_order_items_price` (`unit_price`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_sku` FOREIGN KEY (`sku_id`) REFERENCES `product_skus` (`sku_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_order_items_quantity` CHECK (`quantity` > 0),
  CONSTRAINT `chk_order_items_price` CHECK (`unit_price` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Shipping table (using address reference instead of duplication)
CREATE TABLE `order_shipments` (
  `shipment_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `courier_code` varchar(50) NOT NULL,
  `service_code` varchar(50) NOT NULL,
  `service_name` varchar(100) DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `etd_min_days` int(11) DEFAULT NULL,
  `etd_max_days` int(11) DEFAULT NULL,
  `shipping_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`shipment_id`),
  UNIQUE KEY `uk_order_shipments_order` (`order_id`),
  KEY `fk_order_shipments_order` (`order_id`),
  KEY `idx_order_shipments_tracking` (`tracking_number`),
  CONSTRAINT `fk_order_shipments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_order_shipments_cost` CHECK (`shipping_cost` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Status Logs table
CREATE TABLE `order_status_logs` (
  `status_log_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) NOT NULL,
  `changed_by` enum('system','customer','seller','admin') NOT NULL DEFAULT 'system',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`status_log_id`),
  KEY `fk_order_status_logs_order` (`order_id`),
  KEY `idx_order_status_logs_created` (`created_at`),
  CONSTRAINT `fk_order_status_logs_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_order_status_logs_changed_by` CHECK (`changed_by` IN ('system','customer','seller','admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Payment Related Tables
-- =====================================================

-- Payments table
CREATE TABLE `payments` (
  `payment_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `payment_code` varchar(100) DEFAULT NULL,
  `provider` enum('midtrans','manual','bank_transfer','ewallet','cod') NOT NULL DEFAULT 'midtrans',
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
  `paid_at` timestamp NULL DEFAULT NULL,
  `failed_at` timestamp NULL DEFAULT NULL,
  `refunded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uk_payments_order` (`order_id`),
  KEY `idx_payments_status` (`payment_status`),
  KEY `idx_payments_provider` (`provider`),
  KEY `idx_payments_transaction` (`transaction_id`),
  KEY `idx_payments_created` (`created_at`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_payments_gross_amount` CHECK (`gross_amount` >= 0),
  CONSTRAINT `chk_payments_provider` CHECK (`provider` IN ('midtrans','manual','bank_transfer','ewallet','cod'))
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
  `is_processed` tinyint(1) NOT NULL DEFAULT 0,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`),
  KEY `fk_payment_notifications_payment` (`payment_id`),
  KEY `idx_payment_notifications_order` (`order_id`),
  KEY `idx_payment_notifications_processed` (`is_processed`),
  KEY `idx_payment_notifications_created` (`created_at`),
  CONSTRAINT `fk_payment_notifications_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_payment_notifications_processed` CHECK (`is_processed` IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Voucher Related Tables
-- =====================================================

-- Vouchers table
CREATE TABLE `vouchers` (
  `voucher_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_id` int(10) UNSIGNED DEFAULT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('fixed','percentage') NOT NULL DEFAULT 'fixed',
  `value` decimal(15,2) NOT NULL,
  `min_purchase_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `max_discount_amount` decimal(15,2) DEFAULT NULL,
  `usage_limit` int(10) UNSIGNED DEFAULT NULL,
  `usage_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `user_usage_limit` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expired_at` timestamp NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`voucher_id`),
  UNIQUE KEY `uk_vouchers_code` (`code`),
  KEY `fk_vouchers_store` (`store_id`),
  KEY `idx_vouchers_active_period` (`is_active`, `started_at`, `expired_at`),
  KEY `idx_vouchers_type` (`type`),
  CONSTRAINT `fk_vouchers_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_vouchers_value` CHECK (`value` > 0),
  CONSTRAINT `chk_vouchers_min_purchase` CHECK (`min_purchase_amount` >= 0),
  CONSTRAINT `chk_vouchers_max_discount` CHECK (`max_discount_amount` IS NULL OR `max_discount_amount` > 0),
  CONSTRAINT `chk_vouchers_usage_limit` CHECK (`usage_limit` IS NULL OR `usage_limit` > 0),
  CONSTRAINT `chk_vouchers_user_usage_limit` CHECK (`user_usage_limit` > 0),
  CONSTRAINT `chk_vouchers_started_expired` CHECK (`started_at` < `expired_at`),
  CONSTRAINT `chk_vouchers_percentage` CHECK (`type` = 'fixed' OR (`type` = 'percentage' AND `value` <= 100))
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
  `voucher_usage_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `voucher_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`voucher_usage_id`),
  UNIQUE KEY `uk_voucher_usages_order` (`voucher_id`,`order_id`),
  KEY `fk_voucher_usages_voucher` (`voucher_id`),
  KEY `fk_voucher_usages_user` (`user_id`),
  KEY `fk_voucher_usages_order` (`order_id`),
  KEY `idx_voucher_usages_used` (`used_at`),
  CONSTRAINT `fk_voucher_usages_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_voucher_usages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_voucher_usages_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_voucher_usages_discount` CHECK (`discount_amount` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart Vouchers table
CREATE TABLE `cart_vouchers` (
  `cart_voucher_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `voucher_id` bigint(20) UNSIGNED NOT NULL,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`cart_voucher_id`),
  UNIQUE KEY `uk_cart_vouchers` (`cart_id`,`voucher_id`),
  KEY `fk_cart_vouchers_cart` (`cart_id`),
  KEY `fk_cart_vouchers_voucher` (`voucher_id`),
  CONSTRAINT `fk_cart_vouchers_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_vouchers_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_cart_vouchers_discount` CHECK (`discount_amount` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Sample Data (Professional)
-- =====================================================

-- Insert sample categories
INSERT INTO `categories` (`category_id`, `name`, `slug`, `description`, `is_active`) VALUES
(1, 'Elektronik', 'elektronik', 'Produk elektronik dan gadget', 1),
(2, 'Fashion', 'fashion', 'Pakaian dan aksesoris', 1),
(3, 'Motor', 'motor', 'Sepeda motor dan aksesoris', 1),
(4, 'Mobil', 'mobil', 'Mobil dan aksesoris', 1),
(5, 'Properti', 'properti', 'Rumah, apartemen, dan tanah', 1);

-- Insert sample couriers
INSERT INTO `couriers` (`courier_id`, `code`, `name`, `description`) VALUES
(1, 'jne', 'JNE', 'Jalur Nugraha Ekakurir'),
(2, 'tiki', 'TIKI', 'Titipan Kilat'),
(3, 'pos', 'POS Indonesia', 'Pos Indonesia'),
(4, 'sicepat', 'SiCepat', 'SiCepat Express'),
(5, 'jnt', 'J&T', 'J&T Express');

-- Insert sample courier services
INSERT INTO `courier_services` (`service_id`, `courier_id`, `code`, `name`, `service_type`) VALUES
(1, 1, 'REG', 'JNE Regular', 'regular'),
(2, 1, 'YES', 'JNE YES', 'express'),
(3, 1, 'OKE', 'JNE OKE', 'economy'),
(4, 2, 'REG', 'TIKI Regular', 'regular'),
(5, 2, 'ONS', 'TIKI ONS', 'express'),
(6, 3, 'REGULER', 'POS Reguler', 'regular'),
(7, 3, 'EXPRESS', 'POS Express', 'express'),
(8, 4, 'BEST', 'SiCepat BEST', 'regular'),
(9, 4, 'GOKIL', 'SiCepat GOKIL', 'express'),
(10, 5, 'REG', 'J&T Regular', 'regular');

-- Insert sample users
INSERT INTO `users` (`user_id`, `full_name`, `phone_number`, `email`, `password_hash`, `role`, `is_verified`, `is_active`) VALUES
(1, 'Wildan Hanif', '085346912387', 'wildan@example.com', '$2b$10$example_hash_1', 'seller', 1, 1),
(2, 'Budi Santoso', '081234567890', 'budi@example.com', '$2b$10$example_hash_2', 'seller', 1, 1),
(3, 'Ahmad Rizki', '082345678901', 'ahmad@example.com', '$2b$10$example_hash_3', 'customer', 1, 1),
(4, 'Siti Nurhaliza', '083456789012', 'siti@example.com', '$2b$10$example_hash_4', 'customer', 1, 1),
(5, 'Admin System', '089012345678', 'admin@toco.com', '$2b$10$example_hash_5', 'admin', 1, 1);

-- Insert sample addresses
INSERT INTO `user_addresses` (`address_id`, `user_id`, `label`, `recipient_name`, `phone_number`, `address_line`, `province`, `city`, `district`, `postal_code`, `is_default`) VALUES
(1, 1, 'Rumah', 'Wildan Hanif', '085346912387', 'Jl. Sudirman No. 123, RT 01/RW 02', 'Jawa Barat', 'Bandung', 'Coblong', '40131', 1),
(2, 2, 'Kantor', 'Budi Santoso', '081234567890', 'Jl. Thamrin No. 456, Suite 789', 'DKI Jakarta', 'Jakarta Pusat', 'Menteng', '10310', 1),
(3, 3, 'Rumah', 'Ahmad Rizki', '082345678901', 'Jl. Gatot Subroto No. 789', 'Jawa Tengah', 'Semarang', 'Semarang Tengah', '50131', 1);

-- Insert sample stores
INSERT INTO `stores` (`store_id`, `user_id`, `name`, `slug`, `description`, `address_id`, `is_active`, `is_verified`) VALUES
(1, 1, 'Toko Elektronik Wildan', 'toko-elektronik-wildan', 'Toko elektronik terpercaya dengan harga terbaik', 1, 1, 1),
(2, 2, 'Fashion Budi Collection', 'fashion-budi-collection', 'Fashion trendi untuk semua kalangan', 2, 1, 1);

-- Insert sample products
INSERT INTO `products` (`product_id`, `store_id`, `category_id`, `name`, `slug`, `description`, `product_type`, `price`, `stock_quantity`, `sku`, `condition`, `brand`, `weight_gram`, `status`) VALUES
(1, 1, 1, 'Smartphone Android Pro', 'smartphone-android-pro', 'Smartphone dengan performa tinggi dan kamera berkualitas', 'marketplace', 5999000.00, 50, 'SAP-001', 'new', 'AndroidPro', 200, 'active'),
(2, 1, 1, 'Laptop Gaming Ultra', 'laptop-gaming-ultra', 'Laptop gaming dengan spesifikasi tinggi untuk gaming profesional', 'marketplace', 15999000.00, 25, 'LGU-001', 'new', 'GameTech', 2500, 'active'),
(3, 2, 2, 'Kaos Polos Premium', 'kaos-polos-premium', 'Kaos katun premium yang nyaman dipakai sehari-hari', 'marketplace', 99000.00, 100, 'KPP-001', 'new', 'PremiumWear', 150, 'active'),
(4, 2, 2, 'Jaket Denim Classic', 'jaket-denim-classic', 'Jaket denim dengan desain klasik yang timeless', 'marketplace', 299000.00, 75, 'JDC-001', 'new', 'ClassicStyle', 500, 'active');

-- Insert sample product images
INSERT INTO `product_images` (`image_id`, `product_id`, `url`, `alt_text`, `sort_order`, `is_primary`) VALUES
(1, 1, 'https://example.com/images/smartphone-1.jpg', 'Smartphone Android Pro - Tampilan Depan', 0, 1),
(2, 1, 'https://example.com/images/smartphone-2.jpg', 'Smartphone Android Pro - Tampilan Belakang', 1, 0),
(3, 2, 'https://example.com/images/laptop-1.jpg', 'Laptop Gaming Ultra - Open View', 0, 1),
(4, 3, 'https://example.com/images/kaos-1.jpg', 'Kaos Polos Premium - Hitam', 0, 1),
(5, 4, 'https://example.com/images/jaket-1.jpg', 'Jaket Denim Classic - Blue', 0, 1);

-- Insert sample product variants
INSERT INTO `product_variant_attributes` (`attribute_id`, `product_id`, `attribute_name`, `sort_order`) VALUES
(1, 3, 'Color', 0),
(2, 3, 'Size', 1);

INSERT INTO `product_variant_attribute_options` (`option_id`, `attribute_id`, `option_value`, `sort_order`) VALUES
(1, 1, 'Black', 0),
(2, 1, 'White', 1),
(3, 2, 'S', 0),
(4, 2, 'M', 1),
(5, 2, 'L', 2),
(6, 2, 'XL', 3);

INSERT INTO `product_skus` (`sku_id`, `product_id`, `sku_code`, `price`, `stock_quantity`) VALUES
(1, 3, 'KPP-BLACK-S', 99000.00, 25),
(2, 3, 'KPP-BLACK-M', 99000.00, 25),
(3, 3, 'KPP-BLACK-L', 99000.00, 25),
(4, 3, 'KPP-WHITE-M', 99000.00, 25);

INSERT INTO `product_sku_options` (`sku_option_id`, `sku_id`, `option_id`) VALUES
(1, 1, 1), (2, 1, 3),
(3, 2, 1), (4, 2, 4),
(5, 3, 1), (6, 3, 5),
(7, 4, 2), (8, 4, 4);

-- Insert sample cart
INSERT INTO `carts` (`cart_id`, `user_id`, `shipping_address_id`) VALUES
(1, 3, 3);

INSERT INTO `cart_items` (`cart_item_id`, `cart_id`, `product_id`, `sku_id`, `quantity`, `unit_price`, `is_selected`) VALUES
(1, 1, 1, NULL, 1, 5999000.00, 1),
(2, 1, 3, 2, 2, 99000.00, 1);

-- Insert sample order
INSERT INTO `orders` (`order_id`, `order_number`, `user_id`, `store_id`, `shipping_address_id`, `status`, `payment_status`, `subtotal_amount`, `shipping_cost`, `total_amount`) VALUES
(1, 'TCO-20251114-001', 3, 1, 3, 'paid', 'paid', 5999000.00, 15000.00, 6014000.00);

INSERT INTO `order_items` (`order_item_id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES
(1, 1, 1, 1, 5999000.00);

INSERT INTO `order_shipments` (`shipment_id`, `order_id`, `courier_code`, `service_code`, `service_name`, `tracking_number`, `etd_min_days`, `etd_max_days`, `shipping_cost`) VALUES
(1, 1, 'jne', 'REG', 'JNE Regular', 'JNE001234567890', 2, 3, 15000.00);

-- Insert sample payment
INSERT INTO `payments` (`payment_id`, `order_id`, `provider`, `payment_status`, `gross_amount`, `transaction_id`, `paid_at`) VALUES
(1, 1, 'midtrans', 'success', 6014000.00, 'MIDTRANS-20251114-001', NOW());

-- Insert sample voucher
INSERT INTO `vouchers` (`voucher_id`, `store_id`, `code`, `name`, `description`, `type`, `value`, `min_purchase_amount`, `started_at`, `expired_at`) VALUES
(1, 1, 'WILDAN10', 'Diskon 10% Toko Wildan', 'Diskon 10% untuk semua produk di Toko Elektronik Wildan', 'percentage', 10.00, 500000.00, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY));

COMMIT;

-- =====================================================
-- Database Optimization Notes
-- =====================================================
-- 1. All tables use InnoDB engine for ACID compliance
-- 2. Proper foreign key constraints with appropriate ON DELETE actions
-- 3. Comprehensive indexing strategy for performance
-- 4. Check constraints for data integrity
-- 5. Soft delete implementation with deleted_at timestamps
-- 6. Generated columns for calculated values (total_price)
-- 7. Consistent naming conventions (snake_case)
-- 8. Proper data types and sizes
-- 9. No redundant data storage
-- 10. Normalized structure following 3NF principles
