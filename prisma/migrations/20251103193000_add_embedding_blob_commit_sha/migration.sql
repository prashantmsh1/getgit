-- Add columns for incremental sync (backfill existing rows with empty string)
ALTER TABLE "SourceCodeEmbedding" ADD COLUMN IF NOT EXISTS "blobSha" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SourceCodeEmbedding" ADD COLUMN IF NOT EXISTS "commitSha" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SourceCodeEmbedding" ALTER COLUMN "blobSha" DROP DEFAULT;
ALTER TABLE "SourceCodeEmbedding" ALTER COLUMN "commitSha" DROP DEFAULT;

-- Upsert support for incremental sync
CREATE UNIQUE INDEX IF NOT EXISTS "SourceCodeEmbedding_projectId_fileName_key" ON "SourceCodeEmbedding"("projectId", "fileName");
