import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/api-session";
import { db } from "@/lib/db";
import { isPartnerTyping, listMessages } from "@/services/messages/queries";

/** Polling read: the latest messages (and typing state), or an older page with `?before=<id>`. */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ conversationId: string }> },
) {
	const user = await getApiUser();
	if (!user)
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });

	const { conversationId } = await params;
	const member = await db.conversation.findFirst({
		where: {
			id: conversationId,
			OR: [{ photographerId: user.id }, { clientId: user.id }],
		},
		select: {
			photographerId: true,
			photographerTypingAt: true,
			clientTypingAt: true,
		},
	});
	if (!member) return NextResponse.json({ error: "notFound" }, { status: 404 });

	const before = new URL(request.url).searchParams.get("before") ?? undefined;
	const page = await listMessages(conversationId, before);
	return NextResponse.json(
		{ ...page, typing: isPartnerTyping(member, user.id) },
		{
			headers: { "Cache-Control": "no-store" },
		},
	);
}
