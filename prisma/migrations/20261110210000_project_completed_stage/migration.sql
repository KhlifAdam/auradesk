-- The client only sees the finals once the project is delivered, so the
-- client approval step (VALIDATION) goes. Delivery becomes step 9 and a new
-- last step, COMPLETED, closes the project once the client is happy.
-- Selection now comes before Organization.
-- A project still waiting on approval goes back to EXPORT (finals ready).

ALTER TYPE "project_stage" RENAME TO "project_stage_old";

CREATE TYPE "project_stage" AS ENUM ('BOOKING', 'PREP', 'SHOOTING', 'IMPORT', 'SELECTION', 'ORGANIZATION', 'POST_PRODUCTION', 'EXPORT', 'DELIVERY', 'COMPLETED');

ALTER TABLE "projects" ALTER COLUMN "stage" DROP DEFAULT;

ALTER TABLE "projects" ALTER COLUMN "stage" TYPE "project_stage" USING (
  CASE WHEN "stage"::text = 'VALIDATION' THEN 'EXPORT' ELSE "stage"::text END
)::"project_stage";

ALTER TABLE "projects" ALTER COLUMN "stage" SET DEFAULT 'BOOKING';

DROP TYPE "project_stage_old";
