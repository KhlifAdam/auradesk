-- CreateEnum
CREATE TYPE "gallery_kind" AS ENUM ('PROOFS', 'FINAL');

-- AlterTable
ALTER TABLE "galleries" ADD COLUMN     "kind" "gallery_kind" NOT NULL DEFAULT 'FINAL';

-- AlterTable
ALTER TABLE "gallery_items" ADD COLUMN     "original_modified_at" TIMESTAMP(3),
ADD COLUMN     "original_size" BIGINT;
