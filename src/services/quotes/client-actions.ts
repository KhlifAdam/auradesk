"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireClient } from "@/lib/auth/require-client";
import { db } from "@/lib/db";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { respondQuoteSchema } from "./schemas";

/** The client accepts or declines a quote sent to their account. */
export async function respondToQuote(input: unknown): Promise<ActionResult> {
	const { clientId } = await requireClient();
	const parsed = respondQuoteSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { id, accept } = parsed.data;
	// Only a sent quote, not yet invoiced, waits for an answer.
	const { count } = await db.quote.updateMany({
		where: { id, clientId, status: "SENT", invoiceId: null },
		data: {
			status: accept ? "ACCEPTED" : "DECLINED",
			respondedAt: new Date(),
		},
	});
	if (count === 0) return fail("quoteNotOpen");

	revalidateClientWork();
	return ok();
}
