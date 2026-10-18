import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
	purgeDeliveredProofs,
	purgeExpiredGalleries,
} from "@/services/privacy/purge";

const isScheduler = (header: string | null) => {
	if (!env.CRON_SECRET || !header) return false;
	const given = Buffer.from(header);
	const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
	return given.length === expected.length && timingSafeEqual(given, expected);
};

/**
 * Daily: deletes galleries past their studio's retention, and proofs of
 * delivered projects (see vercel.json).
 * Only the scheduler, which sends `Authorization: Bearer $CRON_SECRET`, may
 * call it.
 */
export async function GET(request: Request) {
	if (!isScheduler(request.headers.get("authorization")))
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });

	const [expired, proofs] = await Promise.all([
		purgeExpiredGalleries(),
		purgeDeliveredProofs(),
	]);
	return NextResponse.json({ deleted: expired + proofs });
}
