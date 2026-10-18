-- AlterTable
ALTER TABLE "galleries" ADD COLUMN     "link_sharing" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "share_downloads" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "share_expires_at" TIMESTAMP(3),
ADD COLUMN     "share_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "galleries_share_token_key" ON "galleries"("share_token");

