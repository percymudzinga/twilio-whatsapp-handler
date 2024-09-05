/*
  Warnings:

  - You are about to drop the column `isCommand` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Message` DROP COLUMN `isCommand`,
    DROP COLUMN `questionId`,
    ADD COLUMN `step` INTEGER NOT NULL DEFAULT 0;
