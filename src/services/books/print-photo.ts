import "server-only";

import { readPrivateObject } from "@/lib/storage/r2-private";
import { cropPhoto } from "./crop-photo";
import type { PhotoLoader } from "./pdf-builder";

/**
 * Reads each photo's original from the private bucket and crops it for the
 * print. `keys` maps a gallery item id to its object key, from an already
 * checked query. One photo at a time: the original is dropped before the next
 * is read.
 */
export function r2PhotoLoader(keys: Map<string, string>): PhotoLoader {
	return async (request) => {
		const key = keys.get(request.itemId);
		if (!key) return null;
		try {
			const original = Buffer.from(
				await new Response(await readPrivateObject(key)).arrayBuffer(),
			);
			return await cropPhoto(original, request);
		} catch (error) {
			console.error(
				`Photo book: couldn't read photo ${request.itemId}:`,
				error,
			);
			return null;
		}
	};
}
