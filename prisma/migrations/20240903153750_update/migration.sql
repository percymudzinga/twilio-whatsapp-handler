/*
  Warnings:

  - You are about to drop the column `nextCommand` on the `Message` table. All the data in the column will be lost.
  - Added the required column `command` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Message` DROP COLUMN `nextCommand`,
    ADD COLUMN `command` VARCHAR(15) NOT NULL;
