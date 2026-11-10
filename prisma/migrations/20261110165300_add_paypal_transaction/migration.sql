-- CreateEnum
CREATE TYPE "PaypalTransactionStatus" AS ENUM ('CREATED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PaypalTransaction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "paypalOrderId" TEXT NOT NULL,
    "captureId" TEXT,
    "status" "PaypalTransactionStatus" NOT NULL DEFAULT 'CREATED',

    CONSTRAINT "PaypalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaypalTransaction_paypalOrderId_key" ON "PaypalTransaction"("paypalOrderId");

-- AddForeignKey
ALTER TABLE "PaypalTransaction" ADD CONSTRAINT "PaypalTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
