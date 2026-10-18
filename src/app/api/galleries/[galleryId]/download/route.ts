import { NextResponse } from "next/server";
import { z } from "zod";
import { attachmentHeader } from "@/lib/content-disposition";
import { requestGalleryAccess } from "@/services/galleries/access";
import { galleryZip } from "@/services/galleries/download";

// A part is at most ZIP_PART_MAX_BYTES, sized to stream within this limit.
export const maxDuration = 300;

const querySchema = z.object({
	selected: z.literal("1").optional(),
	/** The share link's token; read by the access check. */
	t: z.string().optional(),
	part: z.coerce.number().int().min(1).catch(1),
});

/**
 * One part of the gallery as a ZIP (`?selected=1`: only the client's picks;
 * `?part=2`: the second part of a big gallery). Open to its photographer,
 * and to the client once the project is delivered and paid.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ galleryId: string }> },
) {
	const { galleryId } = await params;
	// The signed-in viewer, or anyone holding the client's share link.
	const access = await requestGalleryAccess(request, galleryId);
	if (!access) return NextResponse.json({ error: "notFound" }, { status: 404 });
	// Choosing happens on previews; the originals wait for delivery and payment.
	if (!access.originals)
		return NextResponse.json({ error: "notDelivered" }, { status: 403 });

	const query = querySchema.safeParse(
		Object.fromEntries(new URL(request.url).searchParams),
	);
	if (!query.success)
		return NextResponse.json({ error: "invalidInput" }, { status: 400 });

	const { selected, part } = query.data;
	const zip = await galleryZip(galleryId, selected === "1", part);
	if (!zip) return NextResponse.json({ error: "notFound" }, { status: 404 });

	const headers = new Headers(zip.response.headers);
	headers.set("Content-Disposition", attachmentHeader(zip.filename));
	headers.set("Cache-Control", "private, no-store");
	return new Response(zip.response.body, { headers });
}
