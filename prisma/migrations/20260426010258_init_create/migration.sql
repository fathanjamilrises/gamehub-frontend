-- AlterTable
ALTER TABLE `nominals` ADD COLUMN `sku_code` VARCHAR(100) NULL;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_code` VARCHAR(64) NOT NULL,
    `user_id` INTEGER NULL,
    `player_id` VARCHAR(100) NOT NULL,
    `server_id` VARCHAR(100) NULL,
    `nickname` VARCHAR(100) NOT NULL,
    `game_slug` VARCHAR(255) NOT NULL,
    `game_name` VARCHAR(255) NOT NULL,
    `game_image` VARCHAR(500) NULL,
    `item_label` VARCHAR(255) NOT NULL,
    `item_price` INTEGER NOT NULL,
    `payment_method` VARCHAR(100) NULL,
    `xendit_invoice_id` VARCHAR(255) NULL,
    `xendit_invoice_url` VARCHAR(500) NULL,
    `digiflazz_ref` VARCHAR(100) NULL,
    `digiflazz_status` VARCHAR(50) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `processed_at` DATETIME(3) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `orders_order_code_key`(`order_code`),
    INDEX `orders_user_id`(`user_id`),
    INDEX `orders_order_code`(`order_code`),
    INDEX `orders_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
