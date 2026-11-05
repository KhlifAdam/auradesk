-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "client_seen_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "client_seen_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "client_seen_at" TIMESTAMP(3);

-- Invoices and quotes already issued are not "new" to their client.
UPDATE "invoices" SET "client_seen_at" = now() WHERE "client_id" IS NOT NULL;
UPDATE "quotes" SET "client_seen_at" = now() WHERE "client_id" IS NOT NULL;
