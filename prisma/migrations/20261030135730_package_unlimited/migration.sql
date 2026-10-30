-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "photo_count" INTEGER,
ADD COLUMN     "unlimited_duration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unlimited_photos" BOOLEAN NOT NULL DEFAULT false;
