-- Clean SQL for toco_clone (kept tables only) - suitable for XAMPP/phpMyAdmin
-- Generated from exported DB (toco db terupdate.sql) with unused tables removed
-- Removed: reply_templates, store_about_pages, product_options, product_option_values

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Database: `toco_clone`

-- --------------------------------------------------------
-- Table: carts
CREATE TABLE IF NOT EXISTS `carts` (
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `selected_address_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: cart_items
CREATE TABLE IF NOT EXISTS `cart_items` (
  `cart_item_id` bigint(20) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: cart_shipping_selections
CREATE TABLE IF NOT EXISTS `cart_shipping_selections` (
  `selection_id` bigint(20) UNSIGNED NOT NULL,
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `courier_code` varchar(50) NOT NULL,
  `service_code` varchar(50) NOT NULL,
  `service_name` varchar(100) DEFAULT NULL,
  `etd_min_days` int(11) DEFAULT NULL,
  `etd_max_days` int(11) DEFAULT NULL,
  `delivery_fee` decimal(15,2) NOT NULL DEFAULT 0.00,
  `note` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: cart_vouchers
CREATE TABLE IF NOT EXISTS `cart_vouchers` (
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `voucher_code` varchar(50) NOT NULL,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `voucher_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: categories
CREATE TABLE IF NOT EXISTS `categories` (
  `category_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `parent_id` int(10) UNSIGNED DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` (`category_id`, `name`, `slug`, `parent_id`, `image_url`, `created_at`, `updated_at`) VALUES
(1, 'Jasa', 'jasa', NULL, NULL, '2025-10-26 17:05:08', '2025-10-26 17:05:08'),
(2, 'Jasa Perawatan Pribadi', 'jasa-perawatan-pribadi', 1, NULL, '2025-10-26 17:05:31', '2025-10-26 17:05:31'),
(3, 'Pakaian Pria', 'pakaian-pria', NULL, NULL, '2025-10-31 07:54:32', '2025-10-31 07:54:32'),
(4, 'Motor Bekas', 'motor-bekas', NULL, NULL, '2025-10-31 07:54:45', '2025-10-31 07:54:45'),
(5, 'Mobil Bekas', 'mobil-bekas', NULL, NULL, '2025-10-31 07:54:54', '2025-10-31 07:54:54'),
(6, 'Properti - Rumah', 'properti-rumah', NULL, NULL, '2025-10-31 07:55:07', '2025-10-31 07:55:07');

-- --------------------------------------------------------
-- Table: couriers
CREATE TABLE IF NOT EXISTS `couriers` (
  `courier_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `couriers` (`courier_id`, `code`, `name`, `logo_url`, `is_active`) VALUES
(1, 'gosend', 'GoSend', NULL, 1),
(2, 'jnt', 'J&T', NULL, 1),
(3, 'sicepat', 'SiCepat Logistic', NULL, 1),
(4, 'paxel', 'Paxel', NULL, 1),
(5, 'jne', 'JNE Logistic', NULL, 1),
(6, 'anteraja', 'Anteraja', NULL, 1),
(7, 'pos', 'POS Indonesia', NULL, 1);

-- --------------------------------------------------------
-- Table: courier_services
CREATE TABLE IF NOT EXISTS `courier_services` (
  `service_id` int(11) NOT NULL,
  `courier_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `courier_services` (`service_id`, `courier_id`, `code`, `name`, `description`, `is_active`) VALUES
(1, 1, 'GOSEND_SAMEDAY', 'GoSend Sameday', NULL, 1),
(2, 1, 'GOSEND_INSTANT', 'GoSend Instant', NULL, 1),
(3, 2, 'JNT_HBO', 'J&T HBO', NULL, 1),
(4, 2, 'JNT_NEXTDAY', 'J&T NextDay', NULL, 1),
(5, 2, 'JNT_SAMEDAY', 'J&T SameDay', NULL, 1),
(6, 2, 'JNT_REGULAR', 'J&T Regular', NULL, 1),
(7, 3, 'SICEPAT_BEST', 'SiCepat BEST', NULL, 1),
(8, 3, 'SICEPAT_GOKIL', 'SiCepat GOKIL', NULL, 1),
(9, 3, 'SICEPAT_SIUNTUNG', 'SiCepat SIUNTUNG', NULL, 1),
(10, 4, 'PAXEL_SAMEDAY', 'Paxel Sameday', NULL, 1),
(11, 4, 'PAXEL_BIG', 'Paxel Big', NULL, 1),
(12, 4, 'PAXEL_INSTANT', 'Paxel Instant', NULL, 1),
(13, 5, 'JTR', 'JNE Trucking', NULL, 1),
(14, 5, 'YES', 'JNE Yes', NULL, 1),
(15, 5, 'REG', 'JNE Regular', NULL, 1),
(16, 5, 'OKE', 'JNE OKE', NULL, 1),
(17, 6, 'ANTERAJA_REGULAR', 'Anteraja Regular', NULL, 1),
(18, 6, 'ANTERAJA_NEXTDAY', 'Anteraja Next day', NULL, 1),
(19, 6, 'ANTERAJA_SAMEDAY', 'Anteraja Same Day', NULL, 1),
(20, 7, 'POS_KARGO', 'Pos Kargo', NULL, 1),
(21, 7, 'POS_SAMEDAY', 'Pos Sameday', NULL, 1),
(22, 7, 'POS_REGULAR', 'Pos Regular', NULL, 1),
(23, 7, 'POS_EXPRESS', 'Pos Express', NULL, 1);

-- --------------------------------------------------------
-- Table: products
CREATE TABLE IF NOT EXISTS `products` (
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `product_classification` enum('marketplace','classified') DEFAULT NULL,
  `price` decimal(15,2) NOT NULL,
  `stock` int(10) UNSIGNED DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `condition` enum('new','used') DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `weight_gram` int(10) UNSIGNED DEFAULT NULL,
  `dimensions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dimensions`)),
  `is_preorder` tinyint(1) DEFAULT NULL,
  `use_store_courier` tinyint(1) DEFAULT NULL,
  `insurance` enum('wajib','opsional') DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT NULL,
  `average_rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `review_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `products` (`product_id`, `store_id`, `category_id`, `name`, `slug`, `description`, `product_classification`, `price`, `stock`, `sku`, `condition`, `brand`, `weight_gram`, `dimensions`, `is_preorder`, `use_store_courier`, `insurance`, `status`, `average_rating`, `review_count`, `created_at`, `updated_at`) VALUES
(1, 2, 2, 'Sepatu Lari Pria GO-FAST XTreme', 'sepatu-lari-pria-go-fast-xtreme', '<p>Rasakan kecepatan tanpa batas dengan GO-FAST XTreme. Didesain untuk pelari profesional dengan teknologi bantalan terbaru.</p><ul><li>Bahan: Mesh premium</li><li>Sol: Karet anti-slip</li><li>Warna: Biru Navy</li></ul>', 'marketplace', 799000.00, 150, 'GF-XT-NAVY-42', 'new', 'GO-FAST', 950, '{"length":32,"width":24,"height":12}', 0, 0, 'opsional', 'inactive', 0.00, 0, '2025-10-30 15:48:58', '2025-10-30 15:48:58'),
(3, 2, 2, 'Kaos Polos Premium Katun', 'kaos-polos-premium-katun', 'Kaos bahan katun combed 30s, nyaman dan adem.', 'marketplace', 50000.00, 0, NULL, 'new', 'Toco Brand', 250, NULL, 0, 0, 'opsional', 'inactive', 0.00, 0, '2025-10-31 01:33:10', '2025-10-31 01:33:10'),
(4, 5, 3, 'Sepatu Lari GO-FAST XT', 'sepatu-lari-go-fast-xt', 'Sepatu lari nyaman', 'marketplace', 299000.00, 25, 'GOFAST-42-NAVY', 'new', 'GO-FAST', 900, '{"length":32,"width":22,"height":12}', 0, 0, 'opsional', 'inactive', 0.00, 0, '2025-10-31 08:15:38', '2025-10-31 08:15:38'),
(5, 5, 3, 'Kaos Polos Premium', 'kaos-polos-premium', 'Kaos bahan premium', 'marketplace', 75000.00, 0, NULL, 'new', 'LocalBrand', 200, '{"length":30,"width":20,"height":2}', 0, 1, 'opsional', 'inactive', 0.00, 0, '2025-10-31 08:18:41', '2025-10-31 08:18:41'),
(6, 5, 4, 'Yamaha NMAX 2021', 'yamaha-nmax-2021', 'Kondisi mulus', 'classified', 27000000.00, 1, NULL, 'used', 'Yamaha', 100000, NULL, 0, 0, 'opsional', 'inactive', 0.00, 0, '2025-10-31 08:20:59', '2025-10-31 08:20:59'),
(7, 5, 5, 'Honda Jazz RS 2018', 'honda-jazz-rs-2018', 'Tangan pertama', 'classified', 175000000.00, 1, NULL, 'used', 'Honda', 100000, NULL, 0, 0, 'opsional', 'active', 0.00, 0, '2025-10-31 08:21:20', '2025-10-31 08:29:05'),
(8, 5, 6, 'Rumah Siap Huni Antapani', 'rumah-siap-huni-antapani', 'Lingkungan nyaman', 'classified', 950000000.00, 1, NULL, 'used', NULL, 0, NULL, 0, 0, 'opsional', 'inactive', 0.00, 0, '2025-10-31 08:21:38', '2025-10-31 08:21:38');

-- --------------------------------------------------------
-- Table: product_images
CREATE TABLE IF NOT EXISTS `product_images` (
  `image_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `url` varchar(255) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` smallint(5) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `product_images` (`image_id`, `product_id`, `url`, `alt_text`, `sort_order`) VALUES
(1, 4, 'https://www.google.com/imgres?q=sample%20image&imgurl=https%3A%2F%2Fthumbs.dreamstime.com%2Fb%2Fsample-jpeg-fluffy-white-pomeranian-puppy-sits-looks-camera-colorful-balls-front-364720569.jpg&imgrefurl=https%3A%2F%2Fwww.dreamstime.com%2Fphotos-images%2Fsam', NULL, 0),
(2, 4, 'https://www.google.com/imgres?q=sample%20image&imgurl=https%3A%2F%2Fcdn.pixabay.com%2Fphoto%2F2022%2F01%2F28%2F18%2F32%2Fleaves-6975462_1280.png&imgrefurl=https%3A%2F%2Fpixabay.com%2Fimages%2Fsearch%2Fsample%2F&docid=2xXLFxhaENkZgM&tbnid=wq_9Tnp_-uy-cM&ve', NULL, 1);

-- --------------------------------------------------------
-- Table: product_promotions
CREATE TABLE IF NOT EXISTS `product_promotions` (
  `promotion_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `started_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: product_skus
CREATE TABLE IF NOT EXISTS `product_skus` (
  `product_sku_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `sku_code` varchar(120) NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `weight_gram` int(10) UNSIGNED DEFAULT NULL,
  `dimensions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dimensions`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `product_skus` (`product_sku_id`, `product_id`, `sku_code`, `price`, `stock`, `weight_gram`, `dimensions`, `created_at`, `updated_at`) VALUES
(1, 5, 'KAOS-BLACK-M', 75000.00, 10, 200, NULL, '2025-10-31 08:18:41', '2025-10-31 08:18:41'),
(2, 5, 'KAOS-BLACK-L', 75000.00, 8, 200, NULL, '2025-10-31 08:18:41', '2025-10-31 08:18:41'),
(3, 5, 'KAOS-WHITE-M', 75000.00, 5, 200, NULL, '2025-10-31 08:18:41', '2025-10-31 08:18:41'),
(4, 5, 'KAOS-WHITE-L', 75000.00, 3, 200, NULL, '2025-10-31 08:18:41', '2025-10-31 08:18:41');

-- --------------------------------------------------------
-- Table: product_sku_options
CREATE TABLE IF NOT EXISTS `product_sku_options` (
  `product_sku_option_id` bigint(20) UNSIGNED NOT NULL,
  `product_sku_id` bigint(20) UNSIGNED NOT NULL,
  `option_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `product_sku_options` (`product_sku_option_id`, `product_sku_id`, `option_id`) VALUES
(1, 1, 1),
(2, 1, 3),
(3, 2, 1),
(4, 2, 4),
(5, 3, 2),
(6, 3, 3),
(7, 4, 2),
(8, 4, 4);

-- --------------------------------------------------------
-- Table: product_variant_attributes
CREATE TABLE IF NOT EXISTS `product_variant_attributes` (
  `attribute_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `attribute_name` varchar(100) NOT NULL,
  `sort_order` smallint(5) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `product_variant_attributes` (`attribute_id`, `product_id`, `attribute_name`, `sort_order`) VALUES
(1, 5, 'Color', 0),
(2, 5, 'Size', 1);

-- --------------------------------------------------------
-- Table: product_variant_attribute_options
CREATE TABLE IF NOT EXISTS `product_variant_attribute_options` (
  `option_id` bigint(20) UNSIGNED NOT NULL,
  `attribute_id` bigint(20) UNSIGNED NOT NULL,
  `option_value` varchar(100) NOT NULL,
  `sort_order` smallint(5) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `product_variant_attribute_options` (`option_id`, `attribute_id`, `option_value`, `sort_order`) VALUES
(1, 1, 'Black', 0),
(2, 1, 'White', 1),
(3, 2, 'M', 0),
(4, 2, 'L', 1);

-- --------------------------------------------------------
-- Table: property_specs
CREATE TABLE IF NOT EXISTS `property_specs` (
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `transaction_type` enum('sale','rent') NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `building_area_m2` int(11) DEFAULT NULL,
  `land_area_m2` int(11) DEFAULT NULL,
  `bedrooms` tinyint(3) DEFAULT NULL,
  `bathrooms` tinyint(3) DEFAULT NULL,
  `floors` tinyint(3) DEFAULT NULL,
  `certificate_text` varchar(255) DEFAULT NULL,
  `facilities_text` text DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `property_specs` (`product_id`, `transaction_type`, `price`, `building_area_m2`, `land_area_m2`, `bedrooms`, `bathrooms`, `floors`, `certificate_text`, `facilities_text`, `latitude`, `longitude`) VALUES
(8, 'sale', 950000000.00, 120, 150, 3, 2, 2, 'SHM', 'Keamanan 24 jam, One Gate', -6.92000000, 107.62000000);

-- --------------------------------------------------------
-- Table: stores
CREATE TABLE IF NOT EXISTS `stores` (
  `store_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `profile_image_url` varchar(255) DEFAULT NULL,
  `background_image_url` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `business_phone` varchar(20) DEFAULT NULL,
  `show_business_phone` tinyint(1) DEFAULT 0,
  `address_detail` text DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `province_id` varchar(10) DEFAULT NULL,
  `city_id` varchar(10) DEFAULT NULL,
  `district_id` varchar(10) DEFAULT NULL,
  `sub_district_id` varchar(10) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `sub_district` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `use_cloudflare` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_on_holiday` tinyint(1) NOT NULL DEFAULT 0,
  `holiday_start_date` date DEFAULT NULL,
  `holiday_end_date` date DEFAULT NULL,
  `show_phone_number` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `stores` (`store_id`, `user_id`, `name`, `slug`, `profile_image_url`, `background_image_url`, `description`, `business_phone`, `show_business_phone`, `address_detail`, `postal_code`, `province_id`, `city_id`, `district_id`, `sub_district_id`, `province`, `city`, `district`, `sub_district`, `latitude`, `longitude`, `use_cloudflare`, `is_active`, `created_at`, `updated_at`, `is_on_holiday`, `holiday_start_date`, `holiday_end_date`, `show_phone_number`) VALUES
(2, 6, 'Toko bahan kue', 'toko-bahan-kue', NULL, NULL, 'Menyediakan bahan bahan kue', '081274967462', 0, 'Gedung Jaya Plaza Lt. 2 Blok A No. 15', '40211', '32', '32.73', '32.73.16', '32.73.16.1', 'Jawa Barat', 'Kota Bandung', 'Astanaanyar', 'Karanganyar', -6.92837500, 107.60195300, 0, 1, '2025-10-28 14:51:35', '2025-10-28 15:02:40', 0, NULL, NULL, 0),
(5, 8, 'Suskes Selalu', 'suskes-selalu', '/uploads/stores/profile_image-undefined-1761896264906.jpg', '/uploads/stores/background_image-undefined-1761896264952.jpg', 'Update Deskripsi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-10-31 07:34:48', '2025-10-31 07:37:44', 0, NULL, NULL, 0);

-- --------------------------------------------------------
-- Table: store_courier_distance_rates
CREATE TABLE IF NOT EXISTS `store_courier_distance_rates` (
  `courierDistance_id` int(11) NOT NULL,
  `setting_id` int(11) NOT NULL,
  `from_km` decimal(10,2) NOT NULL,
  `to_km` decimal(10,2) NOT NULL,
  `price` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `store_courier_distance_rates` (`courierDistance_id`, `setting_id`, `from_km`, `to_km`, `price`) VALUES
(10, 2, 0.00, 5.00, 10000),
(11, 2, 5.01, 10.00, 15000),
(12, 2, 10.01, 25.00, 25000),
(17, 2, 0.00, 5.00, 10000),
(18, 2, 5.01, 10.00, 15000),
(19, 2, 10.01, 30.00, 25000),
(20, 2, 30.01, 1000.00, 50000);

-- --------------------------------------------------------
-- Table: store_courier_settings
CREATE TABLE IF NOT EXISTS `store_courier_settings` (
  `setting_id` int(11) NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `max_delivery_km` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `store_courier_settings` (`setting_id`, `store_id`, `is_active`, `max_delivery_km`, `created_at`, `updated_at`) VALUES
(2, 2, 1, 999.00, '2025-11-04 14:20:12', '2025-11-04 14:30:04');

-- --------------------------------------------------------
-- Table: store_courier_weight_rates
CREATE TABLE IF NOT EXISTS `store_courier_weight_rates` (
  `courierWeight_id` int(11) NOT NULL,
  `setting_id` int(11) NOT NULL,
  `above_weight_gr` int(11) NOT NULL,
  `additional_price` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `store_courier_weight_rates` (`courierWeight_id`, `setting_id`, `above_weight_gr`, `additional_price`) VALUES
(1, 2, 1000, 3000),
(2, 2, 2000, 3000);

-- --------------------------------------------------------
-- Table: store_selected_services
CREATE TABLE IF NOT EXISTS `store_selected_services` (
  `store_id` int(10) UNSIGNED NOT NULL,
  `service_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `store_selected_services` (`store_id`, `service_id`) VALUES
(2, 10),
(2, 11),
(2, 14),
(2, 15),
(2, 16);

-- --------------------------------------------------------
-- Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','seller','admin') NOT NULL DEFAULT 'user',
  `is_verified` tinyint(1) DEFAULT 0,
  `google_id` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `gender` enum('Laki-laki','Perempuan') DEFAULT NULL,
  `birth_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` (`user_id`, `full_name`, `phone_number`, `email`, `password`, `role`, `is_verified`, `google_id`, `facebook_id`, `created_at`, `gender`, `birth_date`) VALUES
(6, 'Wildan Hanif', '085346912387', 'dannif@example.com', '$2b$10$Zew98lNQ/fTaWFOA00XiU.VPdykr1kKoip7c9DcgnWrw.rGJhG80G', 'seller', 1, NULL, NULL, '2025-10-28 14:41:40', 'Laki-laki', '2004-08-17'),
(8, 'Budi Santoso', '081234567890', 'budi@example.com', '$2b$10$9f8KhYFxs7UWafbUl/n7FOl3XJFK256CfZ4AFLAGA.kJL/J2o2J76', 'seller', 1, NULL, NULL, '2025-10-31 07:33:14', NULL, NULL),
(12, 'poposiroyo123', '089572583562', 'admin@gmail.com', '$2b$10$onHHT4sJUb5cDTATBVtipuV4sIMJgTt4mjZDSRfo6/2T0RsEiXjBi', 'user', 1, NULL, NULL, '2025-10-31 16:32:03', NULL, NULL);

-- --------------------------------------------------------
-- Table: user_addresses
CREATE TABLE IF NOT EXISTS `user_addresses` (
  `userAddress_id` int(11) NOT NULL,
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
  `district` varchar(100) NOT NULL,
  `sub_district` varchar(100) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `user_addresses` (`userAddress_id`, `user_id`, `label`, `recipient_name`, `phone_number`, `latitude`, `longitude`, `map_address`, `address_detail`, `postal_code`, `province`, `city`, `district`, `sub_district`, `is_primary`, `created_at`, `updated_at`) VALUES
(1, 6, 'Rumah', 'Budi Santoso', '081234567890', -6.17539200, 106.82715300, 'Monumen Nasional, Jalan Silang Merdeka, Gambir, Jakarta Pusat, DKI Jakarta, 10110, Indonesia', 'Lantai 2, dekat patung kuda', '10110', 'DKI JAKARTA', 'KOTA JAKARTA PUSAT', 'Gambir', 'Gambir', 1, '2025-10-28 16:04:21', '2025-10-28 16:04:21');

-- --------------------------------------------------------
-- Table: vehicle_mobil_specs
CREATE TABLE IF NOT EXISTS `vehicle_mobil_specs` (
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `brand` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  `year` smallint(4) NOT NULL,
  `transmission` enum('manual','automatic') NOT NULL,
  `mileage_km` int(11) DEFAULT NULL,
  `license_plate` varchar(20) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `fuel` varchar(50) DEFAULT NULL,
  `engine_cc` int(11) DEFAULT NULL,
  `seat_count` tinyint(3) DEFAULT NULL,
  `tax_expiry_date` date DEFAULT NULL,
  `completeness_text` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vehicle_mobil_specs` (`product_id`, `brand`, `model`, `year`, `transmission`, `mileage_km`, `license_plate`, `color`, `fuel`, `engine_cc`, `seat_count`, `tax_expiry_date`, `completeness_text`, `latitude`, `longitude`) VALUES
(7, 'Honda', 'Jazz RS', 2018, 'automatic', 45000, 'D 1234 AB', 'Orange', 'Gasoline', 1500, 5, '2026-09-01', 'STNK, BPKB', -6.91000000, 107.61000000);

-- --------------------------------------------------------
-- Table: vehicle_motor_specs
CREATE TABLE IF NOT EXISTS `vehicle_motor_specs` (
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `brand` varchar(100) NOT NULL,
  `year` smallint(4) NOT NULL,
  `model` varchar(100) NOT NULL,
  `transmission` enum('manual','automatic') NOT NULL,
  `mileage_km` int(11) DEFAULT NULL,
  `engine_cc` int(11) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `fuel` varchar(50) DEFAULT NULL,
  `tax_expiry_date` date DEFAULT NULL,
  `completeness_text` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vehicle_motor_specs` (`product_id`, `brand`, `year`, `model`, `transmission`, `mileage_km`, `engine_cc`, `color`, `fuel`, `tax_expiry_date`, `completeness_text`, `latitude`, `longitude`) VALUES
(6, 'Yamaha', 2021, 'NMAX', 'automatic', 12000, 155, 'Black', 'Gasoline', '2026-05-01', 'STNK, BPKB', -6.90000000, 107.60000000);

-- --------------------------------------------------------
-- Table: vouchers
CREATE TABLE IF NOT EXISTS `vouchers` (
  `voucher_id` bigint(20) UNSIGNED NOT NULL,
  `store_id` int(10) UNSIGNED DEFAULT NULL,
  `code` varchar(50) NOT NULL,
  `voucher_type` enum('discount','free_shipping') DEFAULT NULL COMMENT 'discount: diskon, free_shipping: gratis ongkir',
  `type` enum('fixed','percent') NOT NULL,
  `value` decimal(15,2) NOT NULL,
  `max_discount` decimal(15,2) DEFAULT NULL,
  `min_discount` decimal(15,2) DEFAULT NULL COMMENT 'minimum diskon untuk persentase',
  `min_order_amount` decimal(15,2) DEFAULT 0.00,
  `title` varchar(255) DEFAULT NULL COMMENT 'judul promosi',
  `description` text DEFAULT NULL COMMENT 'deskripsi promosi',
  `target` enum('public','private') NOT NULL DEFAULT 'public' COMMENT 'public: publik, private: khusus',
  `applicable_to` enum('all_products','specific_products') NOT NULL DEFAULT 'all_products' COMMENT 'semua produk atau produk tertentu',
  `start_at` datetime NOT NULL COMMENT 'periode dimulai',
  `end_at` datetime NOT NULL COMMENT 'periode berakhir',
  `usage_limit_total` int(11) DEFAULT NULL,
  `usage_limit_per_user` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vouchers` (`voucher_id`, `store_id`, `code`, `voucher_type`, `type`, `value`, `max_discount`, `min_discount`, `min_order_amount`, `title`, `description`, `target`, `applicable_to`, `start_at`, `end_at`, `usage_limit_total`, `usage_limit_per_user`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 2, 'HARI_RAYA_50', 'discount', 'percent', 50.00, 100000.00, 10000.00, 50000.00, 'Diskon Spesial Hari Raya', 'Dapatkan diskon hingga 50% untuk semua produk', 'public', 'all_products', '2025-11-01 00:00:00', '2025-11-30 23:59:59', 100, 2, 1, '2025-11-03 04:15:48', '2025-11-03 04:15:48');

-- --------------------------------------------------------
-- Table: voucher_products
CREATE TABLE IF NOT EXISTS `voucher_products` (
  `voucher_product_id` bigint(20) UNSIGNED NOT NULL,
  `voucher_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: voucher_usages
CREATE TABLE IF NOT EXISTS `voucher_usages` (
  `usage_id` bigint(20) UNSIGNED NOT NULL,
  `voucher_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Indexes
ALTER TABLE `carts`
  ADD PRIMARY KEY (`cart_id`),
  ADD UNIQUE KEY `uniq_user_cart` (`user_id`);

ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`cart_item_id`),
  ADD KEY `idx_cart_items_cart` (`cart_id`),
  ADD KEY `idx_cart_items_store` (`store_id`),
  ADD KEY `fk_ci_product` (`product_id`);

ALTER TABLE `cart_shipping_selections`
  ADD PRIMARY KEY (`selection_id`),
  ADD UNIQUE KEY `uniq_cart_store` (`cart_id`,`store_id`);

ALTER TABLE `cart_vouchers`
  ADD PRIMARY KEY (`cart_id`),
  ADD KEY `fk_cv_voucher` (`voucher_id`);

ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `slug_unique` (`slug`),
  ADD KEY `parent_id` (`parent_id`);

ALTER TABLE `couriers`
  ADD PRIMARY KEY (`courier_id`),
  ADD UNIQUE KEY `code` (`code`);

ALTER TABLE `courier_services`
  ADD PRIMARY KEY (`service_id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_service_courier` (`courier_id`);

ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD UNIQUE KEY `slug_unique` (`slug`),
  ADD UNIQUE KEY `store_sku_unique` (`store_id`,`sku`),
  ADD KEY `category_id` (`category_id`);

ALTER TABLE `product_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `product_id` (`product_id`);

ALTER TABLE `product_promotions`
  ADD PRIMARY KEY (`promotion_id`),
  ADD KEY `idx_pp_product` (`product_id`),
  ADD KEY `idx_pp_store` (`store_id`),
  ADD KEY `idx_pp_expires` (`expires_at`);

ALTER TABLE `product_skus`
  ADD PRIMARY KEY (`product_sku_id`),
  ADD UNIQUE KEY `uniq_sku_per_product` (`product_id`,`sku_code`),
  ADD KEY `idx_ps_product` (`product_id`);

ALTER TABLE `product_sku_options`
  ADD PRIMARY KEY (`product_sku_option_id`),
  ADD KEY `idx_pso_sku` (`product_sku_id`),
  ADD KEY `idx_pso_option` (`option_id`);

ALTER TABLE `product_variant_attributes`
  ADD PRIMARY KEY (`attribute_id`),
  ADD KEY `idx_pva_product` (`product_id`);

ALTER TABLE `product_variant_attribute_options`
  ADD PRIMARY KEY (`option_id`),
  ADD KEY `idx_pvao_attribute` (`attribute_id`);

ALTER TABLE `property_specs`
  ADD PRIMARY KEY (`product_id`);

ALTER TABLE `stores`
  ADD PRIMARY KEY (`store_id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `stores_ibfk_1` (`user_id`);

ALTER TABLE `store_courier_distance_rates`
  ADD PRIMARY KEY (`courierDistance_id`),
  ADD KEY `fk_courier_setting_distance` (`setting_id`);

ALTER TABLE `store_courier_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `store_id_unique` (`store_id`);

ALTER TABLE `store_courier_weight_rates`
  ADD PRIMARY KEY (`courierWeight_id`),
  ADD KEY `fk_courier_setting_weight` (`setting_id`);

ALTER TABLE `store_selected_services`
  ADD PRIMARY KEY (`store_id`,`service_id`),
  ADD KEY `fk_selected_service` (`service_id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `phone_number` (`phone_number`),
  ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `user_addresses`
  ADD PRIMARY KEY (`userAddress_id`),
  ADD KEY `user_addresses_ibfk_1` (`user_id`);

ALTER TABLE `vehicle_mobil_specs`
  ADD PRIMARY KEY (`product_id`);

ALTER TABLE `vehicle_motor_specs`
  ADD PRIMARY KEY (`product_id`);

ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`voucher_id`),
  ADD UNIQUE KEY `uniq_voucher_code` (`code`),
  ADD KEY `idx_v_store` (`store_id`),
  ADD KEY `idx_v_start_end` (`start_at`,`end_at`);

ALTER TABLE `voucher_products`
  ADD PRIMARY KEY (`voucher_product_id`),
  ADD UNIQUE KEY `uniq_vp_voucher_product` (`voucher_id`,`product_id`),
  ADD KEY `idx_vp_voucher` (`voucher_id`),
  ADD KEY `idx_vp_product` (`product_id`);

ALTER TABLE `voucher_usages`
  ADD PRIMARY KEY (`usage_id`),
  ADD KEY `idx_vu_voucher` (`voucher_id`),
  ADD KEY `idx_vu_user` (`user_id`);

-- ----------------------------
-- AUTO_INCREMENT
ALTER TABLE `carts`
  MODIFY `cart_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `cart_items`
  MODIFY `cart_item_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `cart_shipping_selections`
  MODIFY `selection_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `categories`
  MODIFY `category_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

ALTER TABLE `couriers`
  MODIFY `courier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

ALTER TABLE `courier_services`
  MODIFY `service_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

ALTER TABLE `products`
  MODIFY `product_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

ALTER TABLE `product_images`
  MODIFY `image_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `product_promotions`
  MODIFY `promotion_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `product_skus`
  MODIFY `product_sku_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

ALTER TABLE `product_sku_options`
  MODIFY `product_sku_option_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

ALTER TABLE `product_variant_attributes`
  MODIFY `attribute_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `product_variant_attribute_options`
  MODIFY `option_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

ALTER TABLE `stores`
  MODIFY `store_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

ALTER TABLE `store_courier_distance_rates`
  MODIFY `courierDistance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

ALTER TABLE `store_courier_settings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `store_courier_weight_rates`
  MODIFY `courierWeight_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

ALTER TABLE `user_addresses`
  MODIFY `userAddress_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `vouchers`
  MODIFY `voucher_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `voucher_products`
  MODIFY `voucher_product_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `voucher_usages`
  MODIFY `usage_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

-- ----------------------------
-- Foreign Keys
ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_ci_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ci_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`);

ALTER TABLE `cart_shipping_selections`
  ADD CONSTRAINT `fk_css_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE;

ALTER TABLE `cart_vouchers`
  ADD CONSTRAINT `fk_cv_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE SET NULL;

ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `courier_services`
  ADD CONSTRAINT `fk_service_courier` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`courier_id`) ON DELETE CASCADE;

ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON UPDATE CASCADE;

ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `product_promotions`
  ADD CONSTRAINT `fk_pp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pp_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE;

ALTER TABLE `product_skus`
  ADD CONSTRAINT `fk_ps_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

ALTER TABLE `product_sku_options`
  ADD CONSTRAINT `fk_pso_option` FOREIGN KEY (`option_id`) REFERENCES `product_variant_attribute_options` (`option_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pso_sku` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`product_sku_id`) ON DELETE CASCADE;

ALTER TABLE `product_variant_attributes`
  ADD CONSTRAINT `fk_pva_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

ALTER TABLE `product_variant_attribute_options`
  ADD CONSTRAINT `fk_pvao_attribute` FOREIGN KEY (`attribute_id`) REFERENCES `product_variant_attributes` (`attribute_id`) ON DELETE CASCADE;

ALTER TABLE `property_specs`
  ADD CONSTRAINT `fk_property_specs_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

ALTER TABLE `stores`
  ADD CONSTRAINT `stores_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

ALTER TABLE `store_courier_distance_rates`
  ADD CONSTRAINT `fk_courier_setting_distance` FOREIGN KEY (`setting_id`) REFERENCES `store_courier_settings` (`setting_id`) ON DELETE CASCADE;

ALTER TABLE `store_courier_settings`
  ADD CONSTRAINT `fk_store_courier_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `store_courier_weight_rates`
  ADD CONSTRAINT `fk_courier_setting_weight` FOREIGN KEY (`setting_id`) REFERENCES `store_courier_settings` (`setting_id`) ON DELETE CASCADE;

ALTER TABLE `store_selected_services`
  ADD CONSTRAINT `fk_selected_service` FOREIGN KEY (`service_id`) REFERENCES `courier_services` (`service_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_selected_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_addresses`
  ADD CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

ALTER TABLE `vehicle_mobil_specs`
  ADD CONSTRAINT `fk_vhcs_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

ALTER TABLE `vehicle_motor_specs`
  ADD CONSTRAINT `fk_vms_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

ALTER TABLE `vouchers`
  ADD CONSTRAINT `fk_v_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE;

ALTER TABLE `voucher_products`
  ADD CONSTRAINT `fk_vp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_vp_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE CASCADE;

ALTER TABLE `voucher_usages`
  ADD CONSTRAINT `fk_vu_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;



