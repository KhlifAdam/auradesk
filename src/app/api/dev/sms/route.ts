import { NextResponse } from "next/server";
import { devInboxEnabled, devSmsInbox } from "@/lib/sms/dev-inbox";

/** Development only: the texts the app would have sent. 404 anywhere else. */
export async function GET() {
	if (!devInboxEnabled())
		return NextResponse.json({ error: "notFound" }, { status: 404 });
	return NextResponse.json(
		{ messages: devSmsInbox() },
		{ headers: { "Cache-Control": "no-store" } },
	);
}
