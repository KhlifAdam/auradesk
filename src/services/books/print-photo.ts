import "server-only";

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readPrivateObject } from "@/lib/storage/r2-private";
import { cropPhoto } from "./crop-photo";
import type { PhotoLoader } from "./pdf-builder";

/** Originals downloaded at once: the wait is the network, not the machine. */
const DOWNLOADS_AT_ONCE = 6;

/**
 * Downloads the originals of a book's photos side by side into a temporary
 * folder, then serves them to the PDF builder one at a time, cropped for the
 * print. `keys` maps a gallery item id to its object key, from an already
 * checked query. Each photo is fetched once however many times it is used, and
 * `cleanup` removes the folder.
 */
export async function prepareR2Photos(keys: Map<string, string>) {
	const dir = await mkdtemp(join(tmpdir(), "photo-book-"));
	const downloaded = new Set<string>();
	const queue = [...keys.entries()];

	async function worker() {
		for (let next = queue.shift(); next; next = queue.shift()) {
			const [itemId, key] = next;
			try {
				const body = Buffer.from(
					await new Response(await readPrivateObject(key)).arrayBuffer(),
				);
				await writeFile(join(dir, itemId), body);
				downloaded.add(itemId);
			} catch (error) {
				console.error(`Photo book: couldn't read photo ${itemId}:`, error);
			}
		}
	}
	await Promise.all(
		Array.from({ length: Math.min(DOWNLOADS_AT_ONCE, queue.length) }, worker),
	);

	const loader: PhotoLoader = async (request) => {
		if (!downloaded.has(request.itemId)) return null;
		try {
			return await cropPhoto(
				await readFile(join(dir, request.itemId)),
				request,
			);
		} catch (error) {
			console.error(
				`Photo book: couldn't crop photo ${request.itemId}:`,
				error,
			);
			return null;
		}
	};
	return { loader, cleanup: () => rm(dir, { recursive: true, force: true }) };
}
