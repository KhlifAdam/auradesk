import { z } from "zod";
import { idSchema } from "@/services/shared/schemas";
import { BILLING_CYCLES, PLAN_IDS, STORAGE_PACK } from "./plans";

export const choosePlanSchema = z.object({
	plan: z.enum(PLAN_IDS),
	cycle: z.enum(BILLING_CYCLES),
	storagePacks: z.number().int().min(0).max(STORAGE_PACK.max),
});

export const recordPaymentSchema = z.object({ userId: idSchema });

export const fakePaymentSchema = z.object({
	paymentRef: z.string().regex(/^[a-f0-9]{24}$/),
});
