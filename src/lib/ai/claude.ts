import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/** The model the assistants use for vision checks. */
export const VISION_MODEL = "claude-opus-5-5";

let client: Anthropic | null | undefined;

/** The Claude client, or null when no API key is configured (vision checks are skipped). */
export function getClaude() {
	client ??= process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
	return client;
}

export const isVisionEnabled = () => getClaude() !== null;
