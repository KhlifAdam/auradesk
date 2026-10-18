import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/api-session";
import { attachmentHeader } from "@/lib/content-disposition";
import { exportAccountData, toJson } from "@/services/privacy/export";

/** Everything held about the signed-in account, as a JSON download. */
export async function GET() {
	const user = await getApiUser();
	if (!user)
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });

	const data = await exportAccountData(user.id);
	if (!data) return NextResponse.json({ error: "notFound" }, { status: 404 });

	const day = data.exportedAt.slice(0, 10);
	return new Response(toJson(data), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Content-Disposition": attachmentHeader(`auradesk-data-${day}.json`),
			"Cache-Control": "private, no-store",
		},
	});
}
