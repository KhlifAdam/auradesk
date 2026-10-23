import { describe, expect, it } from "vitest";
import { collectOriginals } from "@/lib/media/collect-originals";
import { FakeFolder } from "../support/fake-folder";

/** A shoot copied from two cards: the same name exists twice. */
function shoot() {
	const root = new FakeFolder("Wedding");
	root
		.folder("CARD1")
		.file("DSC0001.JPG", 500, 1, 111)
		.file("DSC0001.ARW", 2000, 2)
		.file("DSC0001.xmp", 50, 3);
	root
		.folder("CARD2")
		.file("DSC0001.JPG", 999, 9, 333)
		.file("IMG_0042.jpg", 700, 5, 444)
		.file("IMG_0042.CR3", 3000, 6);
	root.folder(".hidden").file("IMG_0042.jpg", 700, 7, 444);
	return root;
}

const wanted = [
	{ name: "DSC0001.JPG", size: 500, modifiedAt: 111, newBase: "mariage_20260912_0001" },
	{ name: "img_0042.JPG", size: 700, modifiedAt: 444, newBase: "mariage_20260912_0002" },
	{ name: "DSC0001.JPG", size: 999, modifiedAt: 333, newBase: "mariage_20260912_0003" },
	{ name: "DSC0099.JPG", size: 100, modifiedAt: 1, newBase: "mariage_20260912_0004" },
];

const run = (root: FakeFolder, onProgress = (_: number) => {}) =>
	collectOriginals(
		root as unknown as FileSystemDirectoryHandle,
		wanted,
		"mariage - selection",
		onProgress,
	);

describe("collectOriginals", () => {
	it("copies the right originals, renamed, with their RAW and sidecar twins", async () => {
		const root = shoot();
		const progress: number[] = [];
		const report = await run(root, (done) => progress.push(done));

		expect(report).toEqual({ copied: 3, twins: 3, missing: ["DSC0099.JPG"] });
		expect(progress).toEqual([1, 2, 3, 4]);
		const out = await root.getDirectoryHandle("mariage - selection");
		expect([...out.children.keys()].sort()).toEqual([
			"mariage_20260912_0001.arw",
			"mariage_20260912_0001.jpg",
			"mariage_20260912_0001.xmp",
			"mariage_20260912_0002.cr3",
			"mariage_20260912_0002.jpg",
			"mariage_20260912_0003.jpg",
		]);
		// Same name on two cards: told apart by size; the RAW stays with its card.
		expect(out.read("mariage_20260912_0001.jpg")[0]).toBe(1);
		expect(out.read("mariage_20260912_0003.jpg")[0]).toBe(9);
		// Hidden folders are skipped.
		expect(out.read("mariage_20260912_0002.jpg")[0]).toBe(5);
	});

	it("overwrites instead of duplicating when run again", async () => {
		const root = shoot();
		await run(root);
		const again = await run(root);
		expect(again.copied).toBe(3);
		const out = await root.getDirectoryHandle("mariage - selection");
		expect(out.children.size).toBe(6);
	});
});
