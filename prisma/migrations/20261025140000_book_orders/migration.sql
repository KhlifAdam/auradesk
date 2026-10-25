-- CreateEnum
CREATE TYPE "book_order_status" AS ENUM ('DRAFT', 'SUBMITTED', 'ACCEPTED', 'IN_PRODUCTION', 'READY', 'DELIVERED');

-- AlterTable: the studio column starts empty so books that already exist can be filled in.
ALTER TABLE "photo_books" ADD COLUMN     "client_note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "copies" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "invoice_id" TEXT,
ADD COLUMN     "options" JSONB,
ADD COLUMN     "photographer_id" TEXT,
ADD COLUMN     "quote" JSONB,
ADD COLUMN     "status" "book_order_status" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "status_note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "submitted_at" TIMESTAMP(3),
ADD COLUMN     "total" DECIMAL(12,3);

-- Every existing book belongs to the studio of its project.
UPDATE "photo_books" SET "photographer_id" = "projects"."photographer_id"
FROM "projects" WHERE "projects"."id" = "photo_books"."project_id";

ALTER TABLE "photo_books" ALTER COLUMN "photographer_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "book_price_lists" (
    "photographer_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_price_lists_pkey" PRIMARY KEY ("photographer_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "photo_books_invoice_id_key" ON "photo_books"("invoice_id");

-- CreateIndex
CREATE INDEX "photo_books_photographer_id_status_submitted_at_idx" ON "photo_books"("photographer_id", "status", "submitted_at");

-- AddForeignKey
ALTER TABLE "photo_books" ADD CONSTRAINT "photo_books_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_books" ADD CONSTRAINT "photo_books_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_price_lists" ADD CONSTRAINT "book_price_lists_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
