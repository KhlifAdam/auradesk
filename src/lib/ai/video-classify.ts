import "server-only";

import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { VIDEO_CATEGORIES } from "@/services/ai/options";
import { getClaude, VISION_MODEL } from "./claude";

const ClipLabel = z.object({
	category: z.enum(VIDEO_CATEGORIES),
	/** One short sentence, in the requested language. */
	summary: z.string(),
});

export type ClipLabel = z.infer<typeof ClipLabel>;

const LANGUAGES = { en: "English", fr: "French" } as const;

function prompt(language: keyof typeof LANGUAGES) {
	return `These are stills taken at the start, middle and end of one video clip
filmed by a professional photographer/videographer (weddings, events, products,
portraits, corporate work). Pick the category that best describes the clip so
the editor can find it quickly, and write one short sentence (under 20 words,
in ${LANGUAGES[language]}) saying what happens in it.`;
}

/**
 * What kind of clip this is, judged from a few stills. Null when no vision
 * model is configured or the call fails; the rest of the analysis still counts.
 */
export async function classifyClip(
	frames: Buffer[],
	language: keyof typeof LANGUAGES,
): Promise<ClipLabel | null> {
	const anthropic = getClaude();
	if (!anthropic || frames.length === 0) return null;

	try {
		const response = await anthropic.messages.parse({
			model: VISION_MODEL,
			max_tokens: 1024,
			output_config: { effort: "low", format: zodOutputFormat(ClipLabel) },
			messages: [
				{
					role: "user",
					content: [
						...frames.map((frame) => ({
							type: "image" as const,
							source: {
								type: "base64" as const,
								media_type: "image/jpeg" as const,
								data: frame.toString("base64"),
							},
						})),
						{ type: "text", text: prompt(language) },
					],
				},
			],
		});
		if (response.stop_reason === "refusal") return null;
		return response.parsed_output ?? null;
	} catch (error) {
		console.error("Clip classification failed:", error);
		return null;
	}
}
