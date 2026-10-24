import "server-only";

import sharp from "sharp";
import { z } from "zod";
import { askVision, getOpenRouter, jpegPart } from "./openrouter";

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
 * Asks the vision model whether anyone in the photo blinked. Returns null when
 * the check is unavailable or fails, so the rest of the analysis still goes through.
 */
export async function checkEyesClosed(image: Buffer): Promise<boolean | null> {
	if (!getOpenRouter()) return null;

	try {
		const small = await sharp(image)
			.rotate()
			.resize(VISION_EDGE, VISION_EDGE, { fit: "inside" })
			.jpeg({ quality: 80 })
			.toBuffer();
		const result = await askVision("face_check", FaceCheck, [
			jpegPart(small),
			{ type: "text", text: PROMPT },
		]);
		return result ? result.faces > 0 && result.eyesClosed : null;
	} catch (error) {
		console.error("Eyes check failed:", error);
		return null;
	}
}
