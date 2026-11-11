-- AlterTable
ALTER TABLE "photo_books" ADD COLUMN     "awaiting_approval_at" TIMESTAMP(3),
ADD COLUMN     "change_request" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "change_requested_at" TIMESTAMP(3);
