import { NextResponse } from "next/server";
import { isScheduler } from "@/lib/cron";
import { advanceShootDays } from "@/services/projects/auto-stage";

/**
 * Daily: projects whose shoot day has come move to Shooting (see
 * vercel.json). Only the scheduler may call it.
 */
export async function GET(request: Request) {
	if (!isScheduler(request))
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });

	return NextResponse.json({ advanced: await advanceShootDays() });
}
