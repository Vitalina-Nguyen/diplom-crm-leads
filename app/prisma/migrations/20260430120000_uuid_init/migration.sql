-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'INITIAL_ESTIMATION_NEEDS_CLARIFICATION', 'ASSIGNED_TO_EXECUTOR', 'IN_DISCUSSION', 'COMPLETED', 'REJECTED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AssignmentAction" AS ENUM ('ADDED', 'REMOVED');

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadSource" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,

    CONSTRAINT "LeadSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadIngestToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "displayName" TEXT NOT NULL,
    "sourceId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenPreview" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadIngestToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" UUID NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "description" TEXT,
    "sourceId" UUID NOT NULL,
    "status" "LeadStatus" NOT NULL,
    "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "budget" DECIMAL(14,2),
    "finishDate" DATE,
    "createdById" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadContact" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "leadId" UUID NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAssignee" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "leadId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadStatusHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "leadId" UUID NOT NULL,
    "previousStatus" "LeadStatus",
    "newStatus" "LeadStatus" NOT NULL,
    "changedById" UUID NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "LeadStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPriorityHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "leadId" UUID NOT NULL,
    "previousPriority" "LeadPriority",
    "newPriority" "LeadPriority" NOT NULL,
    "changedById" UUID NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "LeadPriorityHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAssignmentHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "leadId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" "AssignmentAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "LeadAssignmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LeadSource_name_key" ON "LeadSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LeadIngestToken_tokenHash_key" ON "LeadIngestToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "LeadAssignee_leadId_userId_key" ON "LeadAssignee"("leadId", "userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadIngestToken" ADD CONSTRAINT "LeadIngestToken_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "LeadSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "LeadSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadContact" ADD CONSTRAINT "LeadContact_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignee" ADD CONSTRAINT "LeadAssignee_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignee" ADD CONSTRAINT "LeadAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadStatusHistory" ADD CONSTRAINT "LeadStatusHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadStatusHistory" ADD CONSTRAINT "LeadStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPriorityHistory" ADD CONSTRAINT "LeadPriorityHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPriorityHistory" ADD CONSTRAINT "LeadPriorityHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignmentHistory" ADD CONSTRAINT "LeadAssignmentHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignmentHistory" ADD CONSTRAINT "LeadAssignmentHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
