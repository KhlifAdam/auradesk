import { describe, expect, it } from "vitest";
import { ZIP_PART_MAX_BYTES } from "@/services/galleries/constants";
import { splitParts, uniqueNames } from "@/services/galleries/zip-parts";

const file = (mb: number) => ({ size: BigInt(Math.round(mb * 1024 * 1024)) });

describe("splitParts", () => {
	it("keeps a small gallery in one ZIP", () => {
		expect(splitParts([file(10), file(20)])).toHaveLength(1);
	});
	it("starts a new part before passing the limit", () => {
		const limitMb = ZIP_PART_MAX_BYTES / 1024 / 1024;
		const parts = splitParts([file(limitMb * 0.6), file(limitMb * 0.6), file(1)]);
		expect(parts.map((part) => part.length)).toEqual([1, 2]);
	});
	it("gives a file bigger than the limit a part of its own", () => {
		const limitMb = ZIP_PART_MAX_BYTES / 1024 / 1024;
		expect(splitParts([file(1), file(limitMb * 2), file(1)])).toHaveLength(3);
	});
});

describe("uniqueNames", () => {
	it("numbers duplicates, ignoring case", () => {
		expect(uniqueNames(["a.jpg", "A.JPG", "b.jpg", "a.jpg"])).toEqual([
			"a.jpg",
			"A (2).JPG",
			"b.jpg",
			"a (3).jpg",
		]);
	});
});
