-- CreateEnum
CREATE TYPE "equipment_category" AS ENUM ('CAMERA', 'LENS', 'LIGHTING', 'AUDIO', 'DRONE', 'SUPPORT', 'STORAGE', 'COMPUTER', 'OTHER');

-- CreateEnum
CREATE TYPE "equipment_status" AS ENUM ('ACTIVE', 'BROKEN', 'RETIRED');

-- CreateEnum
CREATE TYPE "equipment_ownership" AS ENUM ('OWNED', 'HIRED');

-- CreateEnum
CREATE TYPE "equipment_booking_kind" AS ENUM ('PROJECT', 'RENTAL_OUT', 'RENTAL_IN', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "photographer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "equipment_category" NOT NULL DEFAULT 'OTHER',
    "brand" TEXT,
    "model" TEXT,
    "serial_number" TEXT,
    "status" "equipment_status" NOT NULL DEFAULT 'ACTIVE',
    "ownership" "equipment_ownership" NOT NULL DEFAULT 'OWNED',
    "purchase_date" TIMESTAMP(3),
    "purchase_price" DECIMAL(12,3),
    "daily_rate" DECIMAL(12,3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_bookings" (
    "id" TEXT NOT NULL,
    "photographer_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "project_id" TEXT,
    "kind" "equipment_booking_kind" NOT NULL DEFAULT 'PROJECT',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "party_name" TEXT,
    "amount" DECIMAL(12,3),
    "notes" TEXT,
    "returned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipment_photographer_id_category_name_idx" ON "equipment"("photographer_id", "category", "name");

-- CreateIndex
CREATE INDEX "equipment_photographer_id_created_at_idx" ON "equipment"("photographer_id", "created_at");

-- CreateIndex
CREATE INDEX "equipment_bookings_equipment_id_start_date_end_date_idx" ON "equipment_bookings"("equipment_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "equipment_bookings_photographer_id_start_date_idx" ON "equipment_bookings"("photographer_id", "start_date");

-- CreateIndex
CREATE INDEX "equipment_bookings_project_id_idx" ON "equipment_bookings"("project_id");

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_bookings" ADD CONSTRAINT "equipment_bookings_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_bookings" ADD CONSTRAINT "equipment_bookings_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_bookings" ADD CONSTRAINT "equipment_bookings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
