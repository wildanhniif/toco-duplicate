-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 31, 2025 at 02:19 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `toco_clone`
--

-- --------------------------------------------------------

--
-- Table structure for table `attributes`
--

CREATE TABLE `attributes` (
  `attribute_id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `parent_id` int(10) UNSIGNED DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `name`, `slug`, `parent_id`, `image_url`, `created_at`, `updated_at`) VALUES
(1, 'Jasa', 'jasa', NULL, NULL, '2025-10-26 17:05:08', '2025-10-26 17:05:08'),
(2, 'Jasa Perawatan Pribadi', 'jasa-perawatan-pribadi', 1, NULL, '2025-10-26 17:05:31', '2025-10-26 17:05:31');

-- --------------------------------------------------------

--
-- Table structure for table `couriers`
--

CREATE TABLE `couriers` (
  `courier_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `couriers`
--

INSERT INTO `couriers` (`courier_id`, `code`, `name`, `logo_url`, `is_active`) VALUES
(1, 'gosend', 'GoSend', NULL, 1),
(2, 'jnt', 'J&T', NULL, 1),
(3, 'sicepat', 'SiCepat Logistic', NULL, 1),
(4, 'paxel', 'Paxel', NULL, 1),
(5, 'jne', 'JNE Logistic', NULL, 1),
(6, 'anteraja', 'Anteraja', NULL, 1),
(7, 'pos', 'POS Indonesia', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `courier_services`
--

CREATE TABLE `courier_services` (
  `service_id` int(11) NOT NULL,
  `courier_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courier_services`
--

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
(13, 5, 'JNE_TRUCKING', 'JNE Trucking', NULL, 1),
(14, 5, 'JNE_YES', 'JNE Yes', NULL, 1),
(15, 5, 'JNE_REGULAR', 'JNE Regular', NULL, 1),
(16, 5, 'JNE_OKE', 'JNE OKE', NULL, 1),
(17, 6, 'ANTERAJA_REGULAR', 'Anteraja Regular', NULL, 1),
(18, 6, 'ANTERAJA_NEXTDAY', 'Anteraja Next day', NULL, 1),
(19, 6, 'ANTERAJA_SAMEDAY', 'Anteraja Same Day', NULL, 1),
(20, 7, 'POS_KARGO', 'Pos Kargo', NULL, 1),
(21, 7, 'POS_SAMEDAY', 'Pos Sameday', NULL, 1),
(22, 7, 'POS_REGULAR', 'Pos Regular', NULL, 1),
(23, 7, 'POS_EXPRESS', 'Pos Express', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `product_classification` enum('marketplace','classified') NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `sku` varchar(100) DEFAULT NULL,
  `condition` enum('new','used') NOT NULL DEFAULT 'new',
  `brand` varchar(255) DEFAULT NULL,
  `weight_gram` int(10) UNSIGNED NOT NULL,
  `dimensions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dimensions`)),
  `is_preorder` tinyint(1) NOT NULL DEFAULT 0,
  `use_store_courier` tinyint(1) NOT NULL DEFAULT 0,
  `insurance` enum('wajib','opsional') NOT NULL DEFAULT 'opsional',
  `status` enum('active','inactive') NOT NULL DEFAULT 'inactive',
  `average_rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `review_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `store_id`, `category_id`, `name`, `slug`, `description`, `product_classification`, `price`, `stock`, `sku`, `condition`, `brand`, `weight_gram`, `dimensions`, `is_preorder`, `use_store_courier`, `insurance`, `status`, `average_rating`, `review_count`, `created_at`, `updated_at`) VALUES
(1, 2, 2, 'Sepatu Lari Pria GO-FAST XTreme', 'sepatu-lari-pria-go-fast-xtreme', '<p>Rasakan kecepatan tanpa batas dengan GO-FAST XTreme. Didesain untuk pelari profesional dengan teknologi bantalan terbaru.</p><ul><li>Bahan: Mesh premium</li><li>Sol: Karet anti-slip</li><li>Warna: Biru Navy</li></ul>', 'marketplace', 799000.00, 150, 'GF-XT-NAVY-42', 'new', 'GO-FAST', 950, '{\"length\":32,\"width\":24,\"height\":12}', 0, 0, 'opsional', 'inactive', 0.00, 0, '2025-10-30 15:48:58', '2025-10-30 15:48:58');

-- --------------------------------------------------------

--
-- Table structure for table `product_attribute_values`
--

CREATE TABLE `product_attribute_values` (
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `attribute_id` int(10) UNSIGNED NOT NULL,
  `value` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `image_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `variant_id` bigint(20) UNSIGNED DEFAULT NULL,
  `url` varchar(255) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` smallint(5) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_options`
--

CREATE TABLE `product_options` (
  `option_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_options`
--

INSERT INTO `product_options` (`option_id`, `name`) VALUES
(3, 'Penyimpanan'),
(2, 'Ukuran'),
(1, 'Warna');

-- --------------------------------------------------------

--
-- Table structure for table `product_option_values`
--

CREATE TABLE `product_option_values` (
  `value_id` int(10) UNSIGNED NOT NULL,
  `option_id` int(10) UNSIGNED NOT NULL,
  `value` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_option_values`
--

INSERT INTO `product_option_values` (`value_id`, `option_id`, `value`) VALUES
(1, 1, 'Hitam'),
(2, 1, 'Putih'),
(3, 1, 'Merah Maroon'),
(4, 1, 'Biru Navy'),
(5, 2, 'S'),
(6, 2, 'M'),
(7, 2, 'L'),
(8, 2, 'XL'),
(9, 3, '128GB'),
(10, 3, '256GB'),
(11, 3, '512GB');

-- --------------------------------------------------------

--
-- Table structure for table `product_reviews`
--

CREATE TABLE `product_reviews` (
  `review_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL COMMENT 'Rating dari 1 sampai 5',
  `comment` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
  `variant_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `sku` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reply_templates`
--

CREATE TABLE `reply_templates` (
  `reply_id` int(11) NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `content` text NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `review_images`
--

CREATE TABLE `review_images` (
  `image_id` bigint(20) UNSIGNED NOT NULL,
  `review_id` bigint(20) UNSIGNED NOT NULL,
  `url` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stores`
--

CREATE TABLE `stores` (
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

--
-- Dumping data for table `stores`
--

INSERT INTO `stores` (`store_id`, `user_id`, `name`, `slug`, `profile_image_url`, `background_image_url`, `description`, `business_phone`, `show_business_phone`, `address_detail`, `postal_code`, `province_id`, `city_id`, `district_id`, `sub_district_id`, `province`, `city`, `district`, `sub_district`, `latitude`, `longitude`, `use_cloudflare`, `is_active`, `created_at`, `updated_at`, `is_on_holiday`, `holiday_start_date`, `holiday_end_date`, `show_phone_number`) VALUES
(2, 6, 'Toko bahan kue', 'toko-bahan-kue', NULL, NULL, 'Menyediakan bahan bahan kue', '081274967462', 0, 'Gedung Jaya Plaza Lt. 2 Blok A No. 15', '40211', '32', '32.73', '32.73.16', '32.73.16.1', 'Jawa Barat', 'Kota Bandung', 'Astanaanyar', 'Karanganyar', -6.92837500, 107.60195300, 0, 1, '2025-10-28 14:51:35', '2025-10-28 15:02:40', 0, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `store_about_pages`
--

CREATE TABLE `store_about_pages` (
  `about_id` bigint(20) UNSIGNED NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `thumbnail_url` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `store_courier_distance_rates`
--

CREATE TABLE `store_courier_distance_rates` (
  `courierDistance_id` int(11) NOT NULL,
  `setting_id` int(11) NOT NULL,
  `from_km` decimal(10,2) NOT NULL,
  `to_km` decimal(10,2) NOT NULL,
  `price` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `store_courier_settings`
--

CREATE TABLE `store_courier_settings` (
  `setting_id` int(11) NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `max_delivery_km` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `store_courier_weight_rates`
--

CREATE TABLE `store_courier_weight_rates` (
  `courierWeight_id` int(11) NOT NULL,
  `setting_id` int(11) NOT NULL,
  `above_weight_gr` int(11) NOT NULL,
  `additional_price` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `store_selected_services`
--

CREATE TABLE `store_selected_services` (
  `store_id` int(10) UNSIGNED NOT NULL,
  `service_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','seller') NOT NULL DEFAULT 'user',
  `is_verified` tinyint(1) DEFAULT 0,
  `google_id` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `gender` enum('Laki-laki','Perempuan') DEFAULT NULL,
  `birth_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `phone_number`, `email`, `password`, `role`, `is_verified`, `google_id`, `facebook_id`, `created_at`, `gender`, `birth_date`) VALUES
(6, 'Wildan Hanif', '085346912387', 'dannif@example.com', '$2b$10$Zew98lNQ/fTaWFOA00XiU.VPdykr1kKoip7c9DcgnWrw.rGJhG80G', 'seller', 1, NULL, NULL, '2025-10-28 14:41:40', 'Laki-laki', '2004-08-17');

-- --------------------------------------------------------

--
-- Table structure for table `user_addresses`
--

CREATE TABLE `user_addresses` (
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

--
-- Dumping data for table `user_addresses`
--

INSERT INTO `user_addresses` (`userAddress_id`, `user_id`, `label`, `recipient_name`, `phone_number`, `latitude`, `longitude`, `map_address`, `address_detail`, `postal_code`, `province`, `city`, `district`, `sub_district`, `is_primary`, `created_at`, `updated_at`) VALUES
(1, 6, 'Rumah', 'Budi Santoso', '081234567890', -6.17539200, 106.82715300, 'Monumen Nasional, Jalan Silang Merdeka, Gambir, Jakarta Pusat, DKI Jakarta, 10110, Indonesia', 'Lantai 2, dekat patung kuda', '10110', 'DKI JAKARTA', 'KOTA JAKARTA PUSAT', 'Gambir', 'Gambir', 1, '2025-10-28 16:04:21', '2025-10-28 16:04:21');

-- --------------------------------------------------------

--
-- Table structure for table `variant_values`
--

CREATE TABLE `variant_values` (
  `variant_id` bigint(20) UNSIGNED NOT NULL,
  `value_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attributes`
--
ALTER TABLE `attributes`
  ADD PRIMARY KEY (`attribute_id`),
  ADD UNIQUE KEY `category_name_unique` (`category_id`,`name`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `slug_unique` (`slug`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Indexes for table `couriers`
--
ALTER TABLE `couriers`
  ADD PRIMARY KEY (`courier_id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `courier_services`
--
ALTER TABLE `courier_services`
  ADD PRIMARY KEY (`service_id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_service_courier` (`courier_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD UNIQUE KEY `slug_unique` (`slug`),
  ADD UNIQUE KEY `store_sku_unique` (`store_id`,`sku`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `product_attribute_values`
--
ALTER TABLE `product_attribute_values`
  ADD PRIMARY KEY (`product_id`,`attribute_id`),
  ADD KEY `attribute_id` (`attribute_id`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`);

--
-- Indexes for table `product_options`
--
ALTER TABLE `product_options`
  ADD PRIMARY KEY (`option_id`),
  ADD UNIQUE KEY `name_unique` (`name`);

--
-- Indexes for table `product_option_values`
--
ALTER TABLE `product_option_values`
  ADD PRIMARY KEY (`value_id`),
  ADD KEY `option_id` (`option_id`);

--
-- Indexes for table `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`variant_id`),
  ADD UNIQUE KEY `product_sku_unique` (`product_id`,`sku`);

--
-- Indexes for table `reply_templates`
--
ALTER TABLE `reply_templates`
  ADD PRIMARY KEY (`reply_id`),
  ADD KEY `reply_templates_ibfk_1` (`store_id`);

--
-- Indexes for table `review_images`
--
ALTER TABLE `review_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `review_id` (`review_id`);

--
-- Indexes for table `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`store_id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `stores_ibfk_1` (`user_id`);

--
-- Indexes for table `store_about_pages`
--
ALTER TABLE `store_about_pages`
  ADD PRIMARY KEY (`about_id`),
  ADD KEY `fk_about_page_to_store` (`store_id`);

--
-- Indexes for table `store_courier_distance_rates`
--
ALTER TABLE `store_courier_distance_rates`
  ADD PRIMARY KEY (`courierDistance_id`),
  ADD KEY `fk_courier_setting_distance` (`setting_id`);

--
-- Indexes for table `store_courier_settings`
--
ALTER TABLE `store_courier_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `store_id_unique` (`store_id`);

--
-- Indexes for table `store_courier_weight_rates`
--
ALTER TABLE `store_courier_weight_rates`
  ADD PRIMARY KEY (`courierWeight_id`),
  ADD KEY `fk_courier_setting_weight` (`setting_id`);

--
-- Indexes for table `store_selected_services`
--
ALTER TABLE `store_selected_services`
  ADD PRIMARY KEY (`store_id`,`service_id`),
  ADD KEY `fk_selected_service` (`service_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `phone_number` (`phone_number`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD PRIMARY KEY (`userAddress_id`),
  ADD KEY `user_addresses_ibfk_1` (`user_id`);

--
-- Indexes for table `variant_values`
--
ALTER TABLE `variant_values`
  ADD PRIMARY KEY (`variant_id`,`value_id`),
  ADD KEY `value_id` (`value_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attributes`
--
ALTER TABLE `attributes`
  MODIFY `attribute_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `couriers`
--
ALTER TABLE `couriers`
  MODIFY `courier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `courier_services`
--
ALTER TABLE `courier_services`
  MODIFY `service_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `image_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_options`
--
ALTER TABLE `product_options`
  MODIFY `option_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `product_option_values`
--
ALTER TABLE `product_option_values`
  MODIFY `value_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `product_reviews`
--
ALTER TABLE `product_reviews`
  MODIFY `review_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `variant_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reply_templates`
--
ALTER TABLE `reply_templates`
  MODIFY `reply_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `review_images`
--
ALTER TABLE `review_images`
  MODIFY `image_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stores`
--
ALTER TABLE `stores`
  MODIFY `store_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `store_about_pages`
--
ALTER TABLE `store_about_pages`
  MODIFY `about_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `store_courier_distance_rates`
--
ALTER TABLE `store_courier_distance_rates`
  MODIFY `courierDistance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `store_courier_settings`
--
ALTER TABLE `store_courier_settings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `store_courier_weight_rates`
--
ALTER TABLE `store_courier_weight_rates`
  MODIFY `courierWeight_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `user_addresses`
--
ALTER TABLE `user_addresses`
  MODIFY `userAddress_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attributes`
--
ALTER TABLE `attributes`
  ADD CONSTRAINT `attributes_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `courier_services`
--
ALTER TABLE `courier_services`
  ADD CONSTRAINT `fk_service_courier` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`courier_id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON UPDATE CASCADE;

--
-- Constraints for table `product_attribute_values`
--
ALTER TABLE `product_attribute_values`
  ADD CONSTRAINT `product_attribute_values_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `product_attribute_values_ibfk_2` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`attribute_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `product_images_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_option_values`
--
ALTER TABLE `product_option_values`
  ADD CONSTRAINT `product_option_values_ibfk_1` FOREIGN KEY (`option_id`) REFERENCES `product_options` (`option_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reply_templates`
--
ALTER TABLE `reply_templates`
  ADD CONSTRAINT `reply_templates_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `review_images`
--
ALTER TABLE `review_images`
  ADD CONSTRAINT `review_images_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`review_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `stores`
--
ALTER TABLE `stores`
  ADD CONSTRAINT `stores_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

-- --------------------------------------------------------
-- CART TABLES
-- Keranjang per user (satu aktif per user)
CREATE TABLE IF NOT EXISTS `carts` (
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `selected_address_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `carts`
  ADD PRIMARY KEY (`cart_id`),
  ADD UNIQUE KEY `uniq_user_cart` (`user_id`);
ALTER TABLE `carts`
  MODIFY `cart_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

-- Item dalam cart (snapshot beberapa field agar stabil)
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

ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`cart_item_id`),
  ADD KEY `idx_cart_items_cart` (`cart_id`),
  ADD KEY `idx_cart_items_store` (`store_id`);
ALTER TABLE `cart_items`
  MODIFY `cart_item_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

-- Pilihan kurir/jasa per toko di cart
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

ALTER TABLE `cart_shipping_selections`
  ADD PRIMARY KEY (`selection_id`),
  ADD UNIQUE KEY `uniq_cart_store` (`cart_id`,`store_id`);
ALTER TABLE `cart_shipping_selections`
  MODIFY `selection_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

-- Voucher dipasang pada cart (single untuk sederhana)
CREATE TABLE IF NOT EXISTS `cart_vouchers` (
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `voucher_code` varchar(50) NOT NULL,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`cart_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Foreign keys cart
ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_ci_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ci_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE RESTRICT;
ALTER TABLE `cart_shipping_selections`
  ADD CONSTRAINT `fk_css_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE;

-- --------------------------------------------------------
-- VOUCHERS (MASTER)
CREATE TABLE IF NOT EXISTS `vouchers` (
  `voucher_id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL,
  `type` enum('fixed','percent') NOT NULL,
  `value` decimal(15,2) NOT NULL,
  `max_discount` decimal(15,2) DEFAULT NULL,
  `min_order_amount` decimal(15,2) DEFAULT 0.00,
  `start_at` datetime DEFAULT NULL,
  `end_at` datetime DEFAULT NULL,
  `usage_limit_total` int(11) DEFAULT NULL,
  `usage_limit_per_user` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  UNIQUE KEY `uniq_voucher_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`voucher_id`);
ALTER TABLE `vouchers`
  MODIFY `voucher_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

-- Pencatatan penggunaan voucher
CREATE TABLE IF NOT EXISTS `voucher_usages` (
  `usage_id` bigint(20) UNSIGNED NOT NULL,
  `voucher_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `voucher_usages`
  ADD PRIMARY KEY (`usage_id`),
  ADD KEY `idx_vu_voucher` (`voucher_id`),
  ADD KEY `idx_vu_user` (`user_id`);
ALTER TABLE `voucher_usages`
  MODIFY `usage_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `voucher_usages`
  ADD CONSTRAINT `fk_vu_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE CASCADE;

-- Tambahkan kolom voucher_id opsional pada cart_vouchers
ALTER TABLE `cart_vouchers`
  ADD COLUMN `voucher_id` bigint(20) UNSIGNED DEFAULT NULL,
  ADD CONSTRAINT `fk_cv_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE SET NULL;
--
-- Constraints for table `store_about_pages`
--
ALTER TABLE `store_about_pages`
  ADD CONSTRAINT `fk_about_page_to_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `store_courier_distance_rates`
--
ALTER TABLE `store_courier_distance_rates`
  ADD CONSTRAINT `fk_courier_setting_distance` FOREIGN KEY (`setting_id`) REFERENCES `store_courier_settings` (`setting_id`) ON DELETE CASCADE;

--
-- Constraints for table `store_courier_settings`
--
ALTER TABLE `store_courier_settings`
  ADD CONSTRAINT `fk_store_courier_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `store_courier_weight_rates`
--
ALTER TABLE `store_courier_weight_rates`
  ADD CONSTRAINT `fk_courier_setting_weight` FOREIGN KEY (`setting_id`) REFERENCES `store_courier_settings` (`setting_id`) ON DELETE CASCADE;

--
-- Constraints for table `store_selected_services`
--
ALTER TABLE `store_selected_services`
  ADD CONSTRAINT `fk_selected_service` FOREIGN KEY (`service_id`) REFERENCES `courier_services` (`service_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_selected_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `variant_values`
--
ALTER TABLE `variant_values`
  ADD CONSTRAINT `variant_values_ibfk_1` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `variant_values_ibfk_2` FOREIGN KEY (`value_id`) REFERENCES `product_option_values` (`value_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
