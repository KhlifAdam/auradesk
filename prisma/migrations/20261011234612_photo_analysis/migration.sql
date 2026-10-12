-- CreateTable
CREATE TABLE "photo_analyses" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "gallery_id" TEXT NOT NULL,
    "sharpness" DOUBLE PRECISION NOT NULL,
    "brightness" DOUBLE PRECISION NOT NULL,
    "highlights_clipped" DOUBLE PRECISION NOT NULL,
    "shadows_clipped" DOUBLE PRECISION NOT NULL,
    "hash" TEXT NOT NULL,
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eyes_closed" BOOLEAN,
    "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "photo_analyses_item_id_key" ON "photo_analyses"("item_id");

-- CreateIndex
CREATE INDEX "photo_analyses_gallery_id_idx" ON "photo_analyses"("gallery_id");

-- AddForeignKey
ALTER TABLE "photo_analyses" ADD CONSTRAINT "photo_analyses_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "gallery_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
