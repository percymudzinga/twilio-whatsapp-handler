-- CreateTable
CREATE TABLE `Message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `from` VARCHAR(20) NOT NULL,
    `to` VARCHAR(20) NOT NULL,
    `message` VARCHAR(1000) NOT NULL,
    `nextCommand` VARCHAR(15) NOT NULL,
    `messageSid` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
