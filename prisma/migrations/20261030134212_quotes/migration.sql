-- CreateEnum
CREATE TYPE "quote_status" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "photographer_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "project_id" TEXT,
    "client_id" TEXT,
    "number" TEXT NOT NULL,
    "status" "quote_status" NOT NULL DEFAULT 'DRAFT',
    "client_name" TEXT NOT NULL,
    "client_email" TEXT,
    "client_phone" TEXT,
    "client_address" TEXT,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "sent_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "invoice_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,3) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quotes_invoice_id_key" ON "quotes"("invoice_id");

-- CreateIndex
CREATE INDEX "quotes_photographer_id_status_issue_date_idx" ON "quotes"("photographer_id", "status", "issue_date");

-- CreateIndex
CREATE INDEX "quotes_booking_id_idx" ON "quotes"("booking_id");

-- CreateIndex
CREATE INDEX "quotes_client_id_idx" ON "quotes"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_photographer_id_number_key" ON "quotes"("photographer_id", "number");

-- CreateIndex
CREATE INDEX "quote_items_quote_id_position_idx" ON "quote_items"("quote_id", "position");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
