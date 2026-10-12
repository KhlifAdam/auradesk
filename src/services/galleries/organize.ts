import { z } from "zod";
import { idSchema } from "@/services/shared/schemas";

/** Files whose metadata is read per request, so each call stays short. */
export const METADATA_BATCH = 8;

/** `mariage-ben-ali`: letters, digits, dashes and underscores only. */
export const prefixSchema = z
	.string()
	.trim()
	.min(1, "required")
	.max(40, "tooLong")
	.regex(/^[\p{L}\p{N}_-]+$/u, "invalidPrefix");

export const organizeSchema = z.object({
	galleryId: idSchema,
	sort: z.boolean(),
	rename: z.boolean(),
	prefix: z.string(),
});

export type OrganizeValues = z.infer<typeof organizeSchema>;

/** `prefix_20260912_0001.jpg`: the day it was taken, then its place in the shoot. */
export function organizedName(
	prefix: string,
	takenAt: Date,
	index: number,
	extension: string,
) {
	const day = takenAt.toISOString().slice(0, 10).replaceAll("-", "");
	const seq = String(index + 1).padStart(4, "0");
	return `${prefix}_${day}_${seq}${extension ? `.${extension}` : ""}`;
}

/** Lower-case extension of a file name, without the dot. */
export function extensionOf(filename: string) {
	const match = filename.match(/\.([a-z0-9]{1,5})$/i);
	return match ? match[1].toLowerCase() : "";
}

/** A sensible default prefix from a title: "Mariage Ben Ali" → "mariage-ben-ali". */
export function prefixFromTitle(title: string) {
	return (
		title
			.normalize("NFD")
			.replace(/\p{M}/gu, "")
			.toLowerCase()
			.replace(/[^\p{L}\p{N}]+/gu, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 40) || "gallery"
	);
}

export interface OrganizeSummary {
	total: number;
	/** Files whose metadata hasn't been read yet. */
	pending: number;
	/** Files with no capture date (their upload time stands in). */
	undated: number;
	firstAt: string | null;
	lastAt: string | null;
	/** Devices the files came from, most used first; null camera = unknown. */
	sources: { camera: string | null; count: number }[];
	/** Files renamed by an earlier organisation (their names can be restored). */
	renamed: number;
	defaultPrefix: string;
}
