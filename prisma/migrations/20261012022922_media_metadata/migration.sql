-- AlterTable
ALTER TABLE "gallery_items" ADD COLUMN     "camera" TEXT,
ADD COLUMN     "captured_at" TIMESTAMP(3),
ADD COLUMN     "metadata_read_at" TIMESTAMP(3);
