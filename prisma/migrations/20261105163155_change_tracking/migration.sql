-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "client_changed_at" TIMESTAMP(3),
ADD COLUMN     "studio_changed_at" TIMESTAMP(3),
ADD COLUMN     "studio_seen_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "client_changed_at" TIMESTAMP(3),
ADD COLUMN     "studio_changed_at" TIMESTAMP(3),
ADD COLUMN     "studio_seen_at" TIMESTAMP(3);
