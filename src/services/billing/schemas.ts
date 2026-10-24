import { z } from "zod";
import { idSchema } from "@/services/shared/schemas";
import { BILLING_CYCLES, PLAN_IDS } from "./plans";

export const choosePlanSchema = z.object({
	plan: z.enum(PLAN_IDS),
	cycle: z.enum(BILLING_CYCLES),
});

export const recordPaymentSchema = z.object({ userId: idSchema });
