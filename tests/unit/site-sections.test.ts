import { describe, expect, it } from "vitest";
import {
	normalizeDraftSections,
	normalizeSections,
	sectionMediaIds,
} from "@/services/site-sections/normalize";
import {
	SECTION_KINDS,
	saveSectionsSchema,
} from "@/services/site-sections/schemas";
import { toVideoEmbed } from "@/services/site-sections/video-embed";

const kinds = (raw: unknown) => normalizeSections(raw).map((s) => s.kind);

describe("normalizeSections", () => {
	it("gives an old site, stored as [], the default layout", () => {
		expect(kinds([])).toEqual([...SECTION_KINDS]);
		expect(kinds(null)).toEqual([...SECTION_KINDS]);
	});

	it("keeps the saved order and puts a missing kind back after its default neighbour", () => {
		const saved = SECTION_KINDS.filter((kind) => kind !== "faq")
			.reverse()
			.map((kind) => normalizeSections([])[SECTION_KINDS.indexOf(kind)]);
		const result = kinds(saved);
		// faq comes after "about" by default, wherever "about" now is.
		expect(result.indexOf("faq")).toBe(result.indexOf("about") + 1);
		expect(result).toHaveLength(SECTION_KINDS.length);
	});

	it("drops invalid and repeated entries", () => {
		const result = normalizeSections([
			{ kind: "contact", enabled: false, title: "" },
			{ kind: "contact", enabled: true, title: "" },
			{ kind: "nope", enabled: true },
			"junk",
		]);
		expect(result.find((s) => s.kind === "contact")).toMatchObject({
			enabled: false,
		});
		expect(result.filter((s) => s.kind === "contact")).toHaveLength(1);
		expect(result).toHaveLength(SECTION_KINDS.length);
	});

	it("is accepted as-is by the save schema", () => {
		const sections = normalizeSections([]);
		expect(saveSectionsSchema.safeParse({ sections }).success).toBe(true);
		// Missing a kind, or with one twice, is refused.
		expect(
			saveSectionsSchema.safeParse({ sections: sections.slice(1) }).success,
		).toBe(false);
	});
});

describe("sectionMediaIds", () => {
	it("collects logos, photos and the video once each", () => {
		const sections = normalizeSections([
			{
				kind: "clients",
				enabled: true,
				title: "",
				items: [
					{ name: "A", url: "", logoId: "m1" },
					{ name: "B", url: "", logoId: "m1" },
				],
			},
			{
				kind: "showreel",
				enabled: true,
				title: "",
				mediaId: "m2",
				videoUrl: "",
			},
		]);
		expect(sectionMediaIds(sections).sort()).toEqual(["m1", "m2"]);
	});
});

describe("normalizeDraftSections", () => {
	const find = <K extends string>(raw: unknown, kind: K) =>
		normalizeDraftSections(raw).find((section) => section.kind === kind);

	it("keeps the finished items of a half-edited list", () => {
		const faq = find(
			[
				{
					kind: "faq",
					enabled: true,
					title: "",
					items: [
						{ question: "Do you travel?", answer: "Yes" },
						{ question: "Still typing", answer: "" },
					],
				},
			],
			"faq",
		);
		expect(faq && "items" in faq && faq.items).toEqual([
			{ question: "Do you travel?", answer: "Yes" },
		]);
	});

	it("blanks an unfinished video link instead of dropping the section", () => {
		const showreel = find(
			[
				{
					kind: "showreel",
					enabled: false,
					title: "Reel",
					mediaId: null,
					videoUrl: "https://you",
				},
			],
			"showreel",
		);
		expect(showreel).toMatchObject({
			enabled: false,
			title: "Reel",
			videoUrl: "",
		});
	});

	it("still returns the full layout for junk", () => {
		expect(normalizeDraftSections("junk")).toHaveLength(SECTION_KINDS.length);
	});
});

describe("toVideoEmbed", () => {
	it("turns YouTube and Vimeo links into player addresses", () => {
		const yt = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";
		expect(toVideoEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(yt);
		expect(toVideoEmbed("https://youtu.be/dQw4w9WgXcQ")).toBe(yt);
		expect(toVideoEmbed("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(yt);
		expect(toVideoEmbed("https://vimeo.com/76979871")).toBe(
			"https://player.vimeo.com/video/76979871",
		);
	});

	it("refuses anything else", () => {
		expect(toVideoEmbed("https://example.com/video.mp4")).toBeNull();
		expect(toVideoEmbed("https://www.youtube.com/watch?v=bad")).toBeNull();
		expect(toVideoEmbed("not a url")).toBeNull();
	});
});
