-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "photographer_id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "specialty" TEXT,
    "status" "invite_status" NOT NULL DEFAULT 'PENDING',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_assignments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_members_photographer_id_name_idx" ON "team_members"("photographer_id", "name");

-- CreateIndex
CREATE INDEX "team_members_email_status_idx" ON "team_members"("email", "status");

-- CreateIndex
CREATE INDEX "team_members_user_id_status_idx" ON "team_members"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_photographer_id_email_key" ON "team_members"("photographer_id", "email");

-- CreateIndex
CREATE INDEX "project_assignments_member_id_idx" ON "project_assignments"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_assignments_project_id_member_id_key" ON "project_assignments"("project_id", "member_id");

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
