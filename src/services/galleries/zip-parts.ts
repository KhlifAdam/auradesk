// How a gallery is cut into ZIP files. Pure: no database, no storage.

import { ZIP_PART_MAX_BYTES } from "./constants";

/** Two files with the same name would overwrite each other once unzipped. */
export function uniqueNames(names: string[]) {
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
export function splitParts<T extends { size: bigint }>(items: T[]) {
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
