import "server-only";

import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import sharp from "sharp";
import { z } from "zod";
import { getClaude, VISION_MODEL } from "./claude";

/** Faces are judged on a small copy: enough to see eyes, cheap to send. */
const VISION_EDGE = 768;

const FaceCheck = z.object({
	faces: z.number().int().min(0),
	/** True when at least one clearly visible person has their eyes closed. */
	eyesClosed: z.boolean(),
});

const PROMPT = `You review photos for a professional photographer who is culling a shoot.
Count the people whose faces are clearly visible, and say whether any of them
has their eyes closed or caught mid-blink. Ignore faces that are tiny, turned
away or deliberately looking down (e.g. reading), since those aren't mistakes.`;

/**
 * Asks Claude whether anyone in the photo blinked. Returns null when the check
 * is unavailable or fails, so the rest of the analysis still goes through.
 */
export async function checkEyesClosed(image: Buffer): Promise<boolean | null> {
	const anthropic = getClaude();
	if (!anthropic) return null;

	try {
		const small = await sharp(image)
			.rotate()
			.resize(VISION_EDGE, VISION_EDGE, { fit: "inside" })
			.jpeg({ quality: 80 })
			.toBuffer();
		const response = await anthropic.messages.parse({
			model: VISION_MODEL,
			max_tokens: 1024,
			// A quick visual yes/no: low effort keeps it fast and cheap.
			output_config: { effort: "low", format: zodOutputFormat(FaceCheck) },
			messages: [
				{
					role: "user",
					content: [
						{
							type: "image",
							source: {
								type: "base64",
								media_type: "image/jpeg",
								data: small.toString("base64"),
							},
						},
						{ type: "text", text: PROMPT },
					],
				},
			],
		});
		if (response.stop_reason === "refusal") return null;
		const result = response.parsed_output;
		return result ? result.faces > 0 && result.eyesClosed : null;
	} catch (error) {
		console.error("Eyes check failed:", error);
		return null;
	}
}
