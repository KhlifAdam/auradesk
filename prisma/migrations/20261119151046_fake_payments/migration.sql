-- CreateTable
CREATE TABLE "fake_payments" (
    "payment_ref" TEXT NOT NULL,
    "amount_millimes" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "fake_payments_pkey" PRIMARY KEY ("payment_ref")
);
