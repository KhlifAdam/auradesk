import { NextResponse } from "next/server";
import OpenAI from "openai";
import { ASSISTANT_LIMITS } from "@/lib/ai/assistant/limits";
import { TRANSCRIBE_PROMPT } from "@/lib/ai/assistant/transcribe-prompt";
import { cleanTranscript } from "@/lib/ai/assistant/transcript";
import { underVoiceCap } from "@/lib/ai/assistant/voice-caps";
import { getOpenRouter, TRANSCRIBE_MODEL } from "@/lib/ai/openrouter";
import { getApiUser } from "@/lib/auth/api-session";

export const maxDuration = 30;

const deny = (error: string, status: number) =>
	NextResponse.json({ error }, { status });

/**
 * Speech to text for the assistant's composer. The browser sends a short WAV
 * (only when someone actually spoke); the text goes back into the input box
 * so the user can check it before sending. While recording, the browser also
 * asks for `?preview=1` reads of the note so far, counted apart from the
 * final one. The audio is never stored.
 */
export async function POST(request: Request) {
	const user = await getApiUser();
	// Any signed-in account: studio staff and clients in the portal alike.
	if (!user) return deny("unauthorized", 401);
	const openrouter = getOpenRouter();
	if (!openrouter) return deny("assistantUnavailable", 503);

	const form = await request.formData().catch(() => null);
	const audio = form?.get("audio");
	if (!(audio instanceof File) || audio.type !== "audio/wav")
		return deny("invalidInput", 400);
	if (audio.size === 0 || audio.size > ASSISTANT_LIMITS.voiceBytes)
		return deny("tooLong", 400);
	const preview = new URL(request.url).searchParams.has("preview");
	if (!underVoiceCap(preview ? "preview" : "note", user.id))
		return deny("dailyLimit", 429);

	try {
		const data = Buffer.from(await audio.arrayBuffer()).toString("base64");
		const ask = () =>
			openrouter.chat.completions.create({
				model: TRANSCRIBE_MODEL,
				max_tokens: 1024,
				// The same audio should always give the same words.
				temperature: 0,
				messages: [
					{
						role: "user",
						content: [
							{ type: "text", text: TRANSCRIBE_PROMPT },
							{ type: "input_audio", input_audio: { data, format: "wav" } },
						],
					},
				],
			});
		let response: Awaited<ReturnType<typeof ask>>;
		try {
			response = await ask();
		} catch (error) {
			// The shared pool at the provider is sometimes full; the final
			// reading of a note is worth one more try (a preview just waits).
			if (preview || !(error instanceof OpenAI.RateLimitError)) throw error;
			await new Promise((resolve) => setTimeout(resolve, 1000));
			response = await ask();
		}
		const text = response.choices[0]?.message.content ?? "";
		return NextResponse.json({ text: cleanTranscript(text) });
	} catch (error) {
		console.error("Voice transcription failed:", error);
		return deny("transcriptionFailed", 502);
	}
}
