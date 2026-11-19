import "server-only";

import { z } from "zod";
import { VIDEO_CATEGORIES } from "@/services/ai/options";
import { askVision, jpegPart } from "./openrouter";

const ClipLabel = z.object({
	category: z.enum(VIDEO_CATEGORIES),
	/** One short sentence, in the requested language. */
	summary: z.string(),
});

export type ClipLabel = z.infer<typeof ClipLabel>;

const LANGUAGES = { en: "English", fr: "French" } as const;

/**
 * The categories are listed in the prompt on purpose: most open-model providers
 * enforce the schema without showing it to the model, which then guessed blind.
 */
function prompt(language: keyof typeof LANGUAGES) {
	return `These are stills taken at the start, middle and end of one video clip
filmed by a professional photographer/videographer (weddings, events, products,
portraits, corporate work). Pick the category that best describes the clip so
the editor can find it quickly, and write one short sentence (under 20 words,
in ${LANGUAGES[language]}) saying what happens in it.
The category must be one of: ${VIDEO_CATEGORIES.join(", ")}.`;
}

/**
 * What kind of clip this is, judged from a few stills. Null when no vision
 * model is configured or the call fails; the rest of the analysis still counts.
 */
export async function classifyClip(
	frames: Buffer[],
	language: keyof typeof LANGUAGES,
): Promise<ClipLabel | null> {
	if (frames.length === 0) return null;

	try {
		return await askVision("clip_label", ClipLabel, [
			...frames.map(jpegPart),
			{ type: "text", text: prompt(language) },
		]);
	} catch (error) {
		console.error("Clip classification failed:", error);
		return null;
	}
}
