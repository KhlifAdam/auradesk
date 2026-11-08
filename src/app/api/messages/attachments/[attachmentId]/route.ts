import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/api-session";
import { db } from "@/lib/db";
import { getPrivateDownloadUrl } from "@/lib/storage/r2-private";

/** Downloads a message attachment under its name, for the two people in the conversation only. */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ attachmentId: string }> },
) {
	const user = await getApiUser();
	if (!user)
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });

	const { attachmentId } = await params;
	const attachment = await db.messageAttachment.findFirst({
		where: {
			id: attachmentId,
			message: {
				deletedAt: null,
				conversation: {
					OR: [{ photographerId: user.id }, { clientId: user.id }],
				},
			},
		},
		select: { key: true, filename: true },
	});
	if (!attachment)
		return NextResponse.json({ error: "notFound" }, { status: 404 });

	const url = await getPrivateDownloadUrl(attachment.key, attachment.filename);
	return NextResponse.redirect(url, {
		headers: { "Cache-Control": "no-store" },
	});
}
