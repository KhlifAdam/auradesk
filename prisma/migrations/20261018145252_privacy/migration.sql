-- AlterTable
ALTER TABLE "galleries" ADD COLUMN     "watermark" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "studios" ADD COLUMN     "gallery_retention_months" INTEGER,
ADD COLUMN     "strip_gallery_location" BOOLEAN NOT NULL DEFAULT false;
