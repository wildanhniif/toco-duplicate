ALTER TABLE `banners`
ADD COLUMN `type` ENUM('main', 'brand') DEFAULT 'main' AFTER `title`;
