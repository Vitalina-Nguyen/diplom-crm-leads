-- AlterTable
ALTER TABLE "Lead" DROP COLUMN IF EXISTS "address";
ALTER TABLE "Lead" ADD COLUMN "finishDate" DATE;
