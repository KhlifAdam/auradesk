-- CreateEnum
CREATE TYPE "admin_action" AS ENUM ('BAN', 'UNBAN', 'GRANT_ADMIN', 'REVOKE_ADMIN');

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_name" TEXT NOT NULL,
    "action" "admin_action" NOT NULL,
    "target_id" TEXT,
    "target_name" TEXT NOT NULL,
    "target_email" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at");
