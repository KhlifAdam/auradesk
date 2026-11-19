-- CreateEnum
CREATE TYPE "usage_kind" AS ENUM ('ASSISTANT_MESSAGE', 'PHOTO_ANALYSIS');

-- CreateTable
CREATE TABLE "usage_counters" (
    "photographer_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "kind" "usage_kind" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_counters_pkey" PRIMARY KEY ("photographer_id","period","kind")
);

-- AddForeignKey
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
