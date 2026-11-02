-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "client_typing_at" TIMESTAMP(3),
ADD COLUMN     "photographer_typing_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "edited_at" TIMESTAMP(3);
