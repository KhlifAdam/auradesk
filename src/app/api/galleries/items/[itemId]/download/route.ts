import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPrivateDownloadUrl } from "@/lib/storage/r2-private";
import { requestItemAccess } from "@/services/galleries/access";

/**
 * One original, under its own name: redirects to a short signed link, so the
 * bytes come straight from the bucket. Same access rule as the gallery.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ itemId: string }> },
) {
	const { itemId } = await params;
	// The signed-in viewer, or anyone holding the client's share link.
	const access = await requestItemAccess(request, itemId);
	if (!access) return NextResponse.json({ error: "notFound" }, { status: 404 });
	// Choosing happens on previews; the originals wait for delivery and payment.
	if (!access.originals)
		return NextResponse.json({ error: "notDelivered" }, { status: 403 });

	const item = await db.galleryItem.findUnique({
		where: { id: itemId },
		select: { key: true, filename: true },
	});
	if (!item) return NextResponse.json({ error: "notFound" }, { status: 404 });

	const url = await getPrivateDownloadUrl(item.key, item.filename);
	return NextResponse.redirect(url, { status: 302 });
}
