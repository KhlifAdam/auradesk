import "server-only";

import { ASSISTANT_LIMITS } from "@/lib/ai/assistant/limits";

/** Live dictation (Soniox) is on only when its key is set. */
export const isLiveSpeechEnabled = () => Boolean(process.env.SONIOX_API_KEY);

/**
 * A key the browser can use for one dictation and nothing else: it expires
 * within a minute, works once, and the session is cut off shortly after the
 * longest note. The real key never leaves the server. Null when it fails.
 */
export async function mintLiveSpeechKey(userId: string) {
	const apiKey = process.env.SONIOX_API_KEY;
	if (!apiKey) return null;
	const response = await fetch(
		"https://api.soniox.com/v1/auth/temporary-api-key",
		{
			method: "POST",
			headers: {
				authorization: `Bearer ${apiKey}`,
				"content-type": "application/json",
			},
			body: JSON.stringify({
				usage_type: "transcribe_websocket",
				expires_in_seconds: 60,
				single_use: true,
				max_session_duration_seconds: ASSISTANT_LIMITS.voiceSeconds + 15,
				client_reference_id: userId,
			}),
		},
	).catch(() => null);
	if (!response?.ok) return null;
	const { api_key } = (await response.json()) as { api_key: string };
	return api_key;
}
