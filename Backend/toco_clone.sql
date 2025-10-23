-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 23, 2025 at 11:01 AM
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
-- Table structure for table `couriers`
--

CREATE TABLE `couriers` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `couriers`
--

INSERT INTO `couriers` (`id`, `code`, `name`, `logo_url`, `is_active`) VALUES
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
  `id` int(11) NOT NULL,
  `courier_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courier_services`
--

INSERT INTO `courier_services` (`id`, `courier_id`, `code`, `name`, `description`, `is_active`) VALUES
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
-- Table structure for table `reply_templates`
--

CREATE TABLE `reply_templates` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stores`
--

CREATE TABLE `stores` (
  `id` int(11) NOT NULL,
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

INSERT INTO `stores` (`id`, `user_id`, `name`, `slug`, `profile_image_url`, `background_image_url`, `description`, `business_phone`, `show_business_phone`, `address_detail`, `postal_code`, `province_id`, `city_id`, `district_id`, `sub_district_id`, `province`, `city`, `district`, `sub_district`, `latitude`, `longitude`, `use_cloudflare`, `is_active`, `created_at`, `updated_at`, `is_on_holiday`, `holiday_start_date`, `holiday_end_date`, `show_phone_number`) VALUES
(1, 2, 'Toko Baru #2', 'toko-baru-2-1761182868414', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-10-23 01:27:48', '2025-10-23 01:27:48', 0, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `store_about_pages`
--

CREATE TABLE `store_about_pages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `store_id` int(11) NOT NULL,
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
  `id` int(11) NOT NULL,
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
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
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
  `id` int(11) NOT NULL,
  `setting_id` int(11) NOT NULL,
  `above_weight_gr` int(11) NOT NULL,
  `additional_price` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `store_selected_services`
--

CREATE TABLE `store_selected_services` (
  `store_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
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

INSERT INTO `users` (`id`, `full_name`, `phone_number`, `email`, `password`, `role`, `is_verified`, `google_id`, `facebook_id`, `created_at`, `gender`, `birth_date`) VALUES
(2, 'Wildan Hanif', '085346912387', 'dannif@example.com', '$2b$10$faXn5Z6asEn/sCoEJv0l9usqoRqjN5ter.35maKoSEME0rmzSF5CC', 'seller', 1, NULL, NULL, '2025-10-23 01:26:20', 'Laki-laki', '2004-08-17');

-- --------------------------------------------------------

--
-- Table structure for table `user_addresses`
--

CREATE TABLE `user_addresses` (
  `id` int(11) NOT NULL,
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
-- Indexes for dumped tables
--

--
-- Indexes for table `couriers`
--
ALTER TABLE `couriers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `courier_services`
--
ALTER TABLE `courier_services`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_service_courier` (`courier_id`);

--
-- Indexes for table `reply_templates`
--
ALTER TABLE `reply_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `store_about_pages`
--
ALTER TABLE `store_about_pages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_about_page_to_store` (`store_id`);

--
-- Indexes for table `store_courier_distance_rates`
--
ALTER TABLE `store_courier_distance_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_courier_setting_distance` (`setting_id`);

--
-- Indexes for table `store_courier_settings`
--
ALTER TABLE `store_courier_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `store_id_unique` (`store_id`);

--
-- Indexes for table `store_courier_weight_rates`
--
ALTER TABLE `store_courier_weight_rates`
  ADD PRIMARY KEY (`id`),
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
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone_number` (`phone_number`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `couriers`
--
ALTER TABLE `couriers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `courier_services`
--
ALTER TABLE `courier_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `reply_templates`
--
ALTER TABLE `reply_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `stores`
--
ALTER TABLE `stores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `store_about_pages`
--
ALTER TABLE `store_about_pages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `store_courier_distance_rates`
--
ALTER TABLE `store_courier_distance_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `store_courier_settings`
--
ALTER TABLE `store_courier_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `store_courier_weight_rates`
--
ALTER TABLE `store_courier_weight_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user_addresses`
--
ALTER TABLE `user_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `courier_services`
--
ALTER TABLE `courier_services`
  ADD CONSTRAINT `fk_service_courier` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reply_templates`
--
ALTER TABLE `reply_templates`
  ADD CONSTRAINT `reply_templates_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stores`
--
ALTER TABLE `stores`
  ADD CONSTRAINT `stores_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `store_about_pages`
--
ALTER TABLE `store_about_pages`
  ADD CONSTRAINT `fk_about_page_to_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `store_courier_distance_rates`
--
ALTER TABLE `store_courier_distance_rates`
  ADD CONSTRAINT `fk_courier_setting_distance` FOREIGN KEY (`setting_id`) REFERENCES `store_courier_settings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `store_courier_settings`
--
ALTER TABLE `store_courier_settings`
  ADD CONSTRAINT `fk_store_courier_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `store_courier_weight_rates`
--
ALTER TABLE `store_courier_weight_rates`
  ADD CONSTRAINT `fk_courier_setting_weight` FOREIGN KEY (`setting_id`) REFERENCES `store_courier_settings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `store_selected_services`
--
ALTER TABLE `store_selected_services`
  ADD CONSTRAINT `fk_selected_service` FOREIGN KEY (`service_id`) REFERENCES `courier_services` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_selected_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
