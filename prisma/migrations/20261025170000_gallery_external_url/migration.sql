-- A gallery can deliver a Google Drive link instead of uploaded files.
ALTER TABLE "galleries" ADD COLUMN "external_url" TEXT;
