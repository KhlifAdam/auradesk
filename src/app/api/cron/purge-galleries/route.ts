import { NextResponse } from "next/server";
import { isScheduler } from "@/lib/cron";
import {
	purgeDeliveredProofs,
	purgeExpiredGalleries,
} from "@/services/privacy/purge";

/**
 * Daily: deletes galleries past their studio's retention, and proofs of
 * delivered projects (see vercel.json).
 * Only the scheduler, which sends `Authorization: Bearer $CRON_SECRET`, may
 * call it.
 */
export async function GET(request: Request) {
	if (!isScheduler(request))
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });

	const [expired, proofs] = await Promise.all([
		purgeExpiredGalleries(),
		purgeDeliveredProofs(),
	]);
	return NextResponse.json({ deleted: expired + proofs });
}
