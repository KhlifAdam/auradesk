import "server-only";

import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/**
 * True when the request comes from the scheduler (vercel.json crons), which
 * sends `Authorization: Bearer $CRON_SECRET`.
 */
export function isScheduler(request: Request) {
	const header = request.headers.get("authorization");
	if (!env.CRON_SECRET || !header) return false;
	const given = Buffer.from(header);
	const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
	return given.length === expected.length && timingSafeEqual(given, expected);
}
