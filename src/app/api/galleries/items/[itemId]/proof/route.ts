import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { proofImage } from "@/lib/media/watermark";
import { readPrivateObject } from "@/lib/storage/r2-private";
import {
	isDeliveredFinal,
	requestItemAccess,
} from "@/services/galleries/access";
import { PREVIEW_MAX_EDGE } from "@/services/galleries/constants";
import { isGalleryCover } from "@/services/galleries/cover";

/**
 * The picture a client chooses from before delivery, made on the fly from
 * the stored preview: the studio's mark across it (unless the gallery is set
 * unmarked), no metadata. The client never gets a link into the bucket.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ itemId: string }> },
) {
	const { itemId } = await params;
	// The signed-in viewer, or anyone holding the client's share link.
	const access = await requestItemAccess(request, itemId);
	if (!access) return NextResponse.json({ error: "notFound" }, { status: 404 });

	const item = await db.galleryItem.findUnique({
		where: { id: itemId },
		select: {
			key: true,
			previewKey: true,
			type: true,
			gallery: {
				select: {
					watermark: true,
					kind: true,
					project: { select: { stage: true, paymentStatus: true } },
					photographer: { select: { studio: { select: { name: true } } } },
				},
			},
		},
	});
	// A photo without a preview is shrunk from its original; a video has
	// nothing to show without its poster.
	const source = item?.previewKey ?? (item?.type === "IMAGE" ? item.key : null);
	if (!item || !source)
		return NextResponse.json({ error: "notFound" }, { status: 404 });

	const { gallery } = item;
	// Delivered and paid finals are no longer protected, and the cover is the
	// photographer's showcase (checked: `?cover=1` alone unmarks nothing).
	const asCover =
		new URL(request.url).searchParams.get("cover") === "1" &&
		(await isGalleryCover(itemId));
	const label =
		gallery.watermark && !isDeliveredFinal(gallery) && !asCover
			? (gallery.photographer.studio?.name ?? "©")
			: null;
	try {
		const bytes = await new Response(await readPrivateObject(source)).bytes();
		const proof = await proofImage(Buffer.from(bytes), PREVIEW_MAX_EDGE, label);
		return new Response(new Uint8Array(proof), {
			headers: {
				"Content-Type": "image/jpeg",
				// Per viewer only: never kept by a shared cache.
				"Cache-Control": "private, max-age=3600",
			},
		});
	} catch (error) {
		// A format the image library can't read (some RAW files).
		console.error(`Failed to make the proof of ${itemId}:`, error);
		return NextResponse.json({ error: "unsupported" }, { status: 415 });
	}
}
