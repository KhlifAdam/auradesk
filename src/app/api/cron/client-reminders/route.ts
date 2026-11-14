import { NextResponse } from "next/server";
import { isScheduler } from "@/lib/cron";
import { sendClientReminders } from "@/services/reminders/client-reminders";

/**
 * Daily: reminds clients of tomorrow's shoot, invoices due or past due, and
 * galleries about to be removed (see vercel.json). Only the scheduler may
 * call it.
 */
export async function GET(request: Request) {
	if (!isScheduler(request))
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });

	return NextResponse.json(await sendClientReminders());
}
