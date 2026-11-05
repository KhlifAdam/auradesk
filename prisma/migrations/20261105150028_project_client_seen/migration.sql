-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "client_seen_at" TIMESTAMP(3);

-- Projects that already exist are not "new" to their client.
UPDATE "projects" SET "client_seen_at" = now() WHERE "client_id" IS NOT NULL;
