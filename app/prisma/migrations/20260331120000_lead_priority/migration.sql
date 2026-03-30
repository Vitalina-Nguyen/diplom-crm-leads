-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM';

-- CreateTable
CREATE TABLE "LeadPriorityHistory" (
    "id" SERIAL NOT NULL,
    "leadId" TEXT NOT NULL,
    "previousPriority" "LeadPriority",
    "newPriority" "LeadPriority" NOT NULL,
    "changedById" INTEGER NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "LeadPriorityHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LeadPriorityHistory" ADD CONSTRAINT "LeadPriorityHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeadPriorityHistory" ADD CONSTRAINT "LeadPriorityHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Начальная запись истории для уже существующих лидов (приоритет = MEDIUM по умолчанию)
INSERT INTO "LeadPriorityHistory" ("leadId", "previousPriority", "newPriority", "changedById", "comment")
SELECT "id", NULL, "priority", "createdById", NULL
FROM "Lead";
