-- CreateTable
CREATE TABLE "video_analyses" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "gallery_id" TEXT NOT NULL,
    "duration_sec" DOUBLE PRECISION NOT NULL,
    "scene_cuts" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "silences" JSONB NOT NULL DEFAULT '[]',
    "has_audio" BOOLEAN NOT NULL,
    "silence_ratio" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "summary" TEXT,
    "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_analyses_item_id_key" ON "video_analyses"("item_id");

-- CreateIndex
CREATE INDEX "video_analyses_gallery_id_idx" ON "video_analyses"("gallery_id");

-- AddForeignKey
ALTER TABLE "video_analyses" ADD CONSTRAINT "video_analyses_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "gallery_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
