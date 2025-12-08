-- =====================================================
-- Admin Module - Database Schema (MVP)
-- Project: Blibli/Toco Clone - Professional
-- =====================================================
-- Version: 1.0
-- Created: 2025-11-18
-- Notes: This script assumes base schema `toco_clone_professional.sql`
--        has already been executed.

USE toco_clone;

-- Matikan sementara foreign key checks untuk drop tabel
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `admin_audit_logs`;
DROP TABLE IF EXISTS `admin_role_permissions`;
DROP TABLE IF EXISTS `admin_user_roles`;
DROP TABLE IF EXISTS `admin_permissions`;
DROP TABLE IF EXISTS `admin_roles`;
DROP TABLE IF EXISTS `system_settings`;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Admin Audit Logs Table (simple admin model)
-- =====================================================

CREATE TABLE `admin_audit_logs` (
  `audit_log_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` int(11) DEFAULT NULL,
  `actor_type` enum('admin','system') NOT NULL DEFAULT 'admin',
  `action` varchar(100) NOT NULL,
  `target_type` varchar(100) DEFAULT NULL,
  `target_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`audit_log_id`),
  KEY `fk_admin_audit_logs_admin` (`admin_user_id`),
  KEY `idx_admin_audit_logs_target` (`target_type`,`target_id`),
  KEY `idx_admin_audit_logs_action` (`action`),
  KEY `idx_admin_audit_logs_created` (`created_at`),
  CONSTRAINT `fk_admin_audit_logs_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_admin_audit_logs_actor_type` CHECK (`actor_type` IN ('admin','system'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
