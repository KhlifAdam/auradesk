import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/api-session";
import { countPortalNav } from "@/services/portal/home-queries";

/** Polling read: the counts on the client space's nav (projects, bookings). */
export async function GET() {
	const user = await getApiUser();
	if (!user)
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });

	return NextResponse.json(await countPortalNav(user), {
		headers: { "Cache-Control": "no-store" },
	});
}
