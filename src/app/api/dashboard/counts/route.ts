import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/api-session";
import { ROLES } from "@/lib/auth/roles";
import { countStudioNav } from "@/services/changes/studio-counts";

/** Polling read: the counts on the studio's nav (bookings, projects). */
export async function GET() {
	const user = await getApiUser();
	if (!user || user.role !== ROLES.photographer)
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });

	return NextResponse.json(await countStudioNav(user.id), {
		headers: { "Cache-Control": "no-store" },
	});
}
