-- CreateEnum
CREATE TYPE "BillingKind" AS ENUM ('PERIOD', 'UPGRADE');

-- AlterTable
ALTER TABLE "billing_checkouts" ADD COLUMN     "kind" "BillingKind" NOT NULL DEFAULT 'PERIOD';

-- AlterTable
ALTER TABLE "billing_invoices" ADD COLUMN     "kind" "BillingKind" NOT NULL DEFAULT 'PERIOD';

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "scheduled_cycle" "billing_cycle",
ADD COLUMN     "scheduled_plan" "subscription_plan",
ADD COLUMN     "scheduled_storage_packs" INTEGER;
