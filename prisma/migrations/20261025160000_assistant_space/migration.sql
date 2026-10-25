-- The client portal gets its own assistant; each space lists only its threads.
ALTER TABLE "assistant_threads" ADD COLUMN "space" TEXT NOT NULL DEFAULT 'studio';

DROP INDEX "assistant_threads_user_id_updated_at_idx";
CREATE INDEX "assistant_threads_user_id_space_updated_at_idx" ON "assistant_threads"("user_id", "space", "updated_at");
