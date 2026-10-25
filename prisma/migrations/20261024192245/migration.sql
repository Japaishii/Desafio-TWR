-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('pending', 'approved', 'refunded', 'chargeback', 'canceled');

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "SaleStatus" NOT NULL,
    "customerEmail" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sale_occurredAt_idx" ON "Sale"("occurredAt");

-- CreateIndex
CREATE INDEX "Sale_status_occurredAt_idx" ON "Sale"("status", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_platform_transactionId_key" ON "Sale"("platform", "transactionId");
