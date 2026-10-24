import "server-only";

import { ASSISTANT_LIMITS } from "./limits";

const DAY_MS = 86_400_000;

/** Requests per user over the last day. In memory: a soft cap per server. */
const recent = {
	note: new Map<string, number[]>(),
	preview: new Map<string, number[]>(),
};

/**
 * Counts one voice request against the user's daily allowance: a note (one
 * dictation) or a preview (a live re-reading of it). False once it's used up.
 */
export function underVoiceCap(kind: keyof typeof recent, userId: string) {
	const limit =
		kind === "note"
			? ASSISTANT_LIMITS.dailyVoiceNotes
			: ASSISTANT_LIMITS.dailyVoicePreviews;
	const since = Date.now() - DAY_MS;
	const times = (recent[kind].get(userId) ?? []).filter((t) => t > since);
	if (times.length >= limit) return false;
	recent[kind].set(userId, [...times, Date.now()]);
	return true;
}
