-- CreateEnum
CREATE TYPE "payment_gateway" AS ENUM ('KONNECT', 'FAKE', 'MANUAL');

-- CreateEnum
CREATE TYPE "checkout_status" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "billing_invoice_status" AS ENUM ('OPEN', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "billing_checkouts" (
    "id" TEXT NOT NULL,
    "photographer_id" TEXT NOT NULL,
    "gateway" "payment_gateway" NOT NULL,
    "payment_ref" TEXT NOT NULL,
    "pay_url" TEXT NOT NULL,
    "plan" "subscription_plan" NOT NULL,
    "cycle" "billing_cycle" NOT NULL,
    "storage_packs" INTEGER NOT NULL DEFAULT 0,
    "amount_millimes" INTEGER NOT NULL,
    "status" "checkout_status" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "invoice_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "billing_checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_invoices" (
    "id" TEXT NOT NULL,
    "photographer_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "billing_invoice_status" NOT NULL DEFAULT 'OPEN',
    "plan" "subscription_plan" NOT NULL,
    "cycle" "billing_cycle" NOT NULL,
    "storage_packs" INTEGER NOT NULL DEFAULT 0,
    "amount_millimes" INTEGER NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "gateway" "payment_gateway",
    "payment_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_invoice_counters" (
    "year" INTEGER NOT NULL,
    "last_seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "billing_invoice_counters_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_checkouts_payment_ref_key" ON "billing_checkouts"("payment_ref");

-- CreateIndex
CREATE INDEX "billing_checkouts_photographer_id_status_idx" ON "billing_checkouts"("photographer_id", "status");

-- CreateIndex
CREATE INDEX "billing_checkouts_status_expires_at_idx" ON "billing_checkouts"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoices_number_key" ON "billing_invoices"("number");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoices_payment_ref_key" ON "billing_invoices"("payment_ref");

-- CreateIndex
CREATE INDEX "billing_invoices_photographer_id_created_at_idx" ON "billing_invoices"("photographer_id", "created_at");

-- CreateIndex
CREATE INDEX "billing_invoices_status_period_end_idx" ON "billing_invoices"("status", "period_end");

-- AddForeignKey
ALTER TABLE "billing_checkouts" ADD CONSTRAINT "billing_checkouts_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_checkouts" ADD CONSTRAINT "billing_checkouts_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "billing_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
