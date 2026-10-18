-- CreateEnum
CREATE TYPE "cover_template" AS ENUM ('CLASSIC', 'SPLIT', 'FRAME', 'NONE');

-- AlterTable
ALTER TABLE "galleries" ADD COLUMN     "cover_focal_x" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "cover_focal_y" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "cover_item_id" TEXT,
ADD COLUMN     "cover_template" "cover_template" NOT NULL DEFAULT 'CLASSIC';
