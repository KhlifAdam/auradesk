import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/api-session";
import { ROLES } from "@/lib/auth/roles";
import { parseBookDesign, usedItemIds } from "@/lib/books/design";
import { attachmentHeader } from "@/lib/content-disposition";
import { db } from "@/lib/db";
import { buildBookPdf } from "@/services/books/pdf-builder";
import { r2PhotoLoader } from "@/services/books/print-photo";
import { ORDER_STATUSES } from "@/services/books/types";

// Reading and cropping every original takes a while for a big book.
export const maxDuration = 300;

/**
 * The order as a print-ready PDF. For the studio it was sent to only: the
 * client designs and orders, the studio prints. Drafts aren't orders yet.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ bookId: string }> },
) {
	const user = await getApiUser();
	if (!user)
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	if (user.role !== ROLES.photographer)
		return NextResponse.json({ error: "forbidden" }, { status: 403 });

	const { bookId } = await params;
	const book = await db.photoBook.findFirst({
		where: {
			id: bookId,
			photographerId: user.id,
			status: { in: [...ORDER_STATUSES] },
		},
	});
	const design = book && parseBookDesign(book.design);
	if (!book || !design?.success)
		return NextResponse.json({ error: "notFound" }, { status: 404 });

	const photos = await db.galleryItem.findMany({
		where: {
			id: { in: usedItemIds(design.data) },
			photographerId: user.id,
			type: "IMAGE",
		},
		select: { id: true, key: true },
	});
	const keys = new Map(photos.map((photo) => [photo.id, photo.key]));

	const { bytes, missing } = await buildBookPdf(
		design.data,
		r2PhotoLoader(keys),
	);
	return new Response(Buffer.from(bytes), {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": attachmentHeader(
				`${design.data.title || book.title}.pdf`,
			),
			"Cache-Control": "private, no-store",
			// Photos that couldn't be read were left as grey boxes.
			"X-Book-Missing-Photos": String(missing),
		},
	});
}
