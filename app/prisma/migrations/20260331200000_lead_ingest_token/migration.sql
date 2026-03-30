-- CreateTable
CREATE TABLE "LeadIngestToken" (
    "id" SERIAL NOT NULL,
    "displayName" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenPreview" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadIngestToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeadIngestToken_tokenHash_key" ON "LeadIngestToken"("tokenHash");

ALTER TABLE "LeadIngestToken" ADD CONSTRAINT "LeadIngestToken_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "LeadSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
