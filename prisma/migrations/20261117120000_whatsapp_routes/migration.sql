-- CreateEnum
CREATE TYPE "whatsapp_channel" AS ENUM ('BAILEYS', 'CLOUD');

-- AlterEnum
ALTER TYPE "admin_action" ADD VALUE 'WHATSAPP_ROUTE_CHANGED';

-- CreateTable
CREATE TABLE "whatsapp_routes" (
    "kind" TEXT NOT NULL,
    "channel" "whatsapp_channel" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_routes_pkey" PRIMARY KEY ("kind")
);
