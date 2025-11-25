-- ============================================
-- DATABASE SCHEMA: UMbandung Festival 2025
-- Ticketing System
-- ============================================

-- Create orders table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) UNIQUE NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `id_number` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `ticket_price` INT NOT NULL DEFAULT 20000,
  `admin_fee` INT NOT NULL DEFAULT 1000,
  `total` INT NOT NULL,
  `payment_method` VARCHAR(20) DEFAULT 'qris',
  `status` VARCHAR(50) DEFAULT 'pending_payment',
  `proof_file_name` VARCHAR(255) DEFAULT NULL,
  `proof_file_url` TEXT DEFAULT NULL,
  `order_date` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_order_number` (`order_number`),
  INDEX `idx_email` (`email`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create tickets table (untuk generated tickets)
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `ticket_number` VARCHAR(50) UNIQUE NOT NULL,
  `ticket_holder_name` VARCHAR(255) NOT NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  `qr_code_data` TEXT DEFAULT NULL,
  `checked_in` BOOLEAN DEFAULT FALSE,
  `checked_in_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  INDEX `idx_ticket_number` (`ticket_number`),
  INDEX `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create verification_logs table (untuk admin verification tracking)
CREATE TABLE IF NOT EXISTS `verification_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `admin_name` VARCHAR(255) DEFAULT NULL,
  `action` VARCHAR(50) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  INDEX `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE QUERIES
-- ============================================

-- Get all pending orders
-- SELECT * FROM orders WHERE status = 'waiting_verification' ORDER BY created_at DESC;

-- Get order with tickets
-- SELECT o.*, t.ticket_number FROM orders o 
-- LEFT JOIN tickets t ON o.id = t.order_id 
-- WHERE o.order_number = 'UMB20251125123456';

-- Update order status
-- UPDATE orders SET status = 'verified' WHERE order_number = 'UMB20251125123456';

-- Check total revenue
-- SELECT SUM(total) as total_revenue, COUNT(*) as total_orders 
-- FROM orders WHERE status = 'verified';
