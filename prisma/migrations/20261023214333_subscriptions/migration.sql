-- CreateEnum
CREATE TYPE "subscription_plan" AS ENUM ('STARTER', 'PRO', 'STUDIO');

-- CreateEnum
CREATE TYPE "billing_cycle" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterEnum
ALTER TYPE "admin_action" ADD VALUE 'PAYMENT_RECORDED';

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "photographer_id" TEXT NOT NULL,
    "plan" "subscription_plan" NOT NULL DEFAULT 'PRO',
    "cycle" "billing_cycle" NOT NULL DEFAULT 'MONTHLY',
    "trial_ends_at" TIMESTAMP(3) NOT NULL,
    "paid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_photographer_id_key" ON "subscriptions"("photographer_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
