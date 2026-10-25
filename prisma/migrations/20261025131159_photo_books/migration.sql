-- CreateTable
CREATE TABLE "photo_books" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "design" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_books_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "photo_books_client_id_project_id_idx" ON "photo_books"("client_id", "project_id");

-- AddForeignKey
ALTER TABLE "photo_books" ADD CONSTRAINT "photo_books_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_books" ADD CONSTRAINT "photo_books_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
