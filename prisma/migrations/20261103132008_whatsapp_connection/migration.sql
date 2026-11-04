-- CreateEnum
CREATE TYPE "whatsapp_status" AS ENUM ('CONNECTED', 'DOWN', 'LOGGED_OUT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "admin_action" ADD VALUE 'WHATSAPP_LINK_REQUESTED';
ALTER TYPE "admin_action" ADD VALUE 'WHATSAPP_UNLINKED';

-- CreateTable
CREATE TABLE "whatsapp_connections" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "status" "whatsapp_status" NOT NULL,
    "phone_number" TEXT,
    "reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alerted_at" TIMESTAMP(3),

    CONSTRAINT "whatsapp_connections_pkey" PRIMARY KEY ("id")
);
