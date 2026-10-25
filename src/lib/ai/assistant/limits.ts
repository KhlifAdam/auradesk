/** Guardrails on what one person can spend on the assistant. */
export const ASSISTANT_LIMITS = {
	/** Model round trips (tool calls included) for one question. */
	maxSteps: 8,
	/** Questions per person in any 24 hours. */
	dailyMessages: 150,
	/** Questions per client in the portal in any 24 hours. */
	clientDailyMessages: 40,
	/** Longest voice note, in seconds. */
	voiceSeconds: 60,
	/** Largest voice note upload: 60 s of 16 kHz mono is about 1.9 MB. */
	voiceBytes: 3_000_000,
	/** Voice notes per person in any 24 hours. */
	dailyVoiceNotes: 80,
	/** How often the live preview re-reads the note while it is recorded. */
	previewEveryMs: 3000,
	/** Live previews per person in any 24 hours (about 20 per minute spoken). */
	dailyVoicePreviews: 1500,
	/** Longest question, in characters. */
	messageChars: 4000,
	/** Threads per page on the assistant page. */
	threadPageSize: 20,
} as const;
