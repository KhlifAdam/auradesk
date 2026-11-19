import { NextResponse } from "next/server";
import { isScheduler } from "@/lib/cron";
import { runBillingJob } from "@/services/billing/billing-job";

/**
 * Daily: checks pending subscription payments with the gateway (in case a
 * webhook was lost) and opens renewal invoices ahead of each period's end.
 * Only the scheduler may call it.
 */
export async function GET(request: Request) {
	if (!isScheduler(request))
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });

	return NextResponse.json(await runBillingJob());
}
