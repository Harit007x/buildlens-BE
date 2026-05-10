-- CreateEnum
CREATE TYPE "MilestoneStage" AS ENUM ('FOUNDATION', 'STRUCTURE', 'BRICKWORK', 'PLUMBING', 'ELECTRICAL', 'PLASTERING', 'FLOORING', 'FINISHING', 'HANDOVER');

-- CreateEnum
CREATE TYPE "UpdateStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "PropertyUpdate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stage" "MilestoneStage" NOT NULL,
    "status" "UpdateStatus" NOT NULL DEFAULT 'DRAFT',
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdatePhoto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdatePhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PropertyUpdate" ADD CONSTRAINT "PropertyUpdate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdatePhoto" ADD CONSTRAINT "UpdatePhoto_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "PropertyUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
