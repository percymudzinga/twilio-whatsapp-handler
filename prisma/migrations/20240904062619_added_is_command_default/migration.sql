/*
  Warnings:

  - Made the column `isCommand` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Message` MODIFY `isCommand` BOOLEAN NOT NULL DEFAULT false;
