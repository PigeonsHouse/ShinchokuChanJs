/*
  Warnings:

  - You are about to drop the column `isFinished` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "isFinished",
ADD COLUMN     "isReported" BOOLEAN NOT NULL DEFAULT false;
