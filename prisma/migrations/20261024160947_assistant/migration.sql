-- CreateTable
CREATE TABLE "assistant_threads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "parts" JSONB NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_messages_pkey" PRIMARY KEY ("thread_id","id")
);

-- CreateIndex
CREATE INDEX "assistant_threads_user_id_updated_at_idx" ON "assistant_threads"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "assistant_messages_thread_id_position_idx" ON "assistant_messages"("thread_id", "position");

-- AddForeignKey
ALTER TABLE "assistant_threads" ADD CONSTRAINT "assistant_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "assistant_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
