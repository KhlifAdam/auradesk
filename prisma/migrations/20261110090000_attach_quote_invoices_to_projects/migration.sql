-- An invoice made from a booking's quote before the booking was confirmed had
-- no project; confirming then linked only the quote. Attach those invoices to
-- the booking's project, so each amount is billed and counted on its project.
UPDATE "invoices" AS i
SET "project_id" = b."project_id"
FROM "quotes" AS q
JOIN "bookings" AS b ON b."id" = q."booking_id"
WHERE q."invoice_id" = i."id"
  AND i."project_id" IS NULL
  AND b."project_id" IS NOT NULL;
