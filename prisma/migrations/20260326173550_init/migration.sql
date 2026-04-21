/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "categories" DROP COLUMN "isDeleted",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "products" DROP COLUMN "isDeleted",
ADD COLUMN     "deletedAt" TIMESTAMP(3);
