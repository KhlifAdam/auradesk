import "server-only";

import { downloadZip } from "client-zip";
import { db } from "@/lib/db";
import { readPrivateObject } from "@/lib/storage/r2-private";
import { ZIP_PART_MAX_BYTES } from "./constants";
import { GALLERY_ITEM_ORDER } from "./queries";

/** Two files with the same name would overwrite each other once unzipped. */
function uniqueNames(names: string[]) {
	const seen = new Map<string, number>();
	return names.map((name) => {
		const count = seen.get(name.toLowerCase()) ?? 0;
		seen.set(name.toLowerCase(), count + 1);
		if (count === 0) return name;
		const dot = name.lastIndexOf(".");
		return dot > 0
			? `${name.slice(0, dot)} (${count + 1})${name.slice(dot)}`
			: `${name} (${count + 1})`;
	});
}

/**
 * Cuts the files, in gallery order, into ZIPs of at most ZIP_PART_MAX_BYTES
 * (a bigger file gets one to itself). Each part is its own short request, so
 * a huge gallery never outlives a server's time limit, and a cut connection
 * only costs one part.
 */
function splitParts<T extends { size: bigint }>(items: T[]) {
	const parts: T[][] = [];
	let current: T[] = [];
	let bytes = 0;
	for (const item of items) {
		const size = Number(item.size);
		if (current.length > 0 && bytes + size > ZIP_PART_MAX_BYTES) {
			parts.push(current);
			current = [];
			bytes = 0;
		}
		current.push(item);
		bytes += size;
	}
	if (current.length > 0) parts.push(current);
	return parts;
}

async function galleryParts(galleryId: string, selectedOnly: boolean) {
	const items = await db.galleryItem.findMany({
		where: { galleryId, ...(selectedOnly && { selected: true }) },
		orderBy: GALLERY_ITEM_ORDER,
		select: { key: true, filename: true, size: true, createdAt: true },
	});
	// Named across the whole gallery, so names stay unique between parts.
	const names = uniqueNames(items.map((item) => item.filename));
	return splitParts(items.map((item, i) => ({ ...item, name: names[i] })));
}

/** How many ZIPs the gallery, and its picks, come in. Call after an access check. */
export async function zipPartCounts(galleryId: string) {
	const [all, selected] = await Promise.all([
		galleryParts(galleryId, false),
		galleryParts(galleryId, true),
	]);
	return { all: all.length, selected: selected.length };
}

/**
 * One part (1-based) of the gallery, or of its picks, as a ZIP, streamed:
 * each file is read from the bucket while the previous one is being sent, so
 * nothing big sits in memory. Files are stored, not recompressed: the bytes
 * are the originals'. Call after an access check.
 */
export async function galleryZip(
	galleryId: string,
	selectedOnly: boolean,
	part: number,
) {
	const [gallery, parts] = await Promise.all([
		db.gallery.findUnique({
			where: { id: galleryId },
			select: { title: true },
		}),
		galleryParts(galleryId, selectedOnly),
	]);
	const items = parts[part - 1];
	if (!gallery || !items) return null;

	const metadata = items.map(({ name, size }) => ({ name, size }));

	async function* files() {
		for (const item of items) {
			yield {
				name: item.name,
				size: item.size,
				lastModified: item.createdAt,
				input: await readPrivateObject(item.key),
			};
		}
	}

	// `metadata` lets the ZIP's exact length be sent, so browsers show progress.
	const zip = downloadZip(files(), { metadata });
	const suffix = parts.length > 1 ? ` (${part}-${parts.length})` : "";
	return { response: zip, filename: `${gallery.title}${suffix}.zip` };
}
