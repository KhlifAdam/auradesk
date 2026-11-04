import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { env } from "@/lib/env";
import { recordStatus } from "@/lib/whatsapp/connection-status";

const reportSchema = z.object({
	state: z.enum(["CONNECTED", "DOWN", "LOGGED_OUT"]),
	phone: z.string().max(32).nullable().optional(),
	reason: z.string().max(500).nullable().optional(),
});

/**
 * The WhatsApp gateway reports its status here (wa-gateway/src/watchdog.ts).
 * A route handler rather than a Server Action: the caller is a machine.
 */
export async function POST(request: Request) {
	if (!fromGateway(request))
		return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
	const parsed = reportSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success)
		return Response.json({ error: "INVALID" }, { status: 400 });

	const { state, ...details } = parsed.data;
	const { changed } = await recordStatus(state, details);
	if (changed) revalidatePath("/admin", "layout");
	return Response.json({ ok: true });
}

function fromGateway(request: Request) {
	const secret = env.WA_GATEWAY_SECRET;
	const header = request.headers.get("authorization");
	if (!secret || !header) return false;
	const given = Buffer.from(header);
	const expected = Buffer.from(`Bearer ${secret}`);
	return given.length === expected.length && timingSafeEqual(given, expected);
}
