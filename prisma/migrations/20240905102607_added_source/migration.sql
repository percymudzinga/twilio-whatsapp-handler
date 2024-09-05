/*
  Warnings:

  - Added the required column `source` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Message` ADD COLUMN `source` VARCHAR(20) NOT NULL;
