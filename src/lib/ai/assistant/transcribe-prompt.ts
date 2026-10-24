/**
 * What the transcription model is told to do with a voice note. Kept short:
 * a longer, bulleted version made the English transcripts worse in testing.
 */
export const TRANSCRIBE_PROMPT =
	"Transcribe this voice note word for word. Keep the language it is spoken in (usually French or English, sometimes mixed). Write names as they sound. Reply with the transcript only, no quotes or comments, and never add words that weren't said, such as thanks or a goodbye. If nothing is said, reply with an empty string.";
