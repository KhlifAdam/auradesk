-- Projects marked paid (or unpaid) by hand, without invoice payments, kept
-- the old amount: "Paid" showed next to "Already paid: 0". Align the amount
-- with the status, as the app now does when the status is set.
UPDATE "projects" p
SET "advance" = p."price"
WHERE p."payment_status" = 'PAID'
  AND p."price" IS NOT NULL
  AND p."advance" < p."price"
  AND NOT EXISTS (
    SELECT 1 FROM "invoice_payments" ip
    JOIN "invoices" i ON i."id" = ip."invoice_id"
    WHERE i."project_id" = p."id"
  );

UPDATE "projects" p
SET "advance" = 0
WHERE p."payment_status" = 'UNPAID'
  AND p."advance" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "invoice_payments" ip
    JOIN "invoices" i ON i."id" = ip."invoice_id"
    WHERE i."project_id" = p."id"
  );
