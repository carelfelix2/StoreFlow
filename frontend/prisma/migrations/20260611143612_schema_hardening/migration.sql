/*
  Warnings:

  - Changed the type of `action` on the `order_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OrderLogAction" AS ENUM ('STATUS_CHANGED', 'ITEM_ADDED', 'ITEM_UPDATED', 'ITEM_REMOVED', 'PAYMENT_STARTED', 'PAYMENT_PAID', 'ORDER_CANCELLED', 'ORDER_VOIDED', 'PRINTED');

-- AlterTable
ALTER TABLE "order_logs" DROP COLUMN "action",
ADD COLUMN     "action" "OrderLogAction" NOT NULL;

-- AlterTable
ALTER TABLE "payment_logs" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "unit_name" TEXT,
ADD COLUMN     "unit_qty" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "payment_logs_created_by_idx" ON "payment_logs"("created_by");

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
