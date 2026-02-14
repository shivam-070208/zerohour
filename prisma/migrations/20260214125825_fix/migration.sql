/*
  Warnings:

  - Added the required column `recommendationId` to the `Edge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Edge" ADD COLUMN     "recommendationId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
