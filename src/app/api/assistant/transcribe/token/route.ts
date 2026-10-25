import { NextResponse } from "next/server";
import { underVoiceCap } from "@/lib/ai/assistant/voice-caps";
import { isLiveSpeechEnabled, mintLiveSpeechKey } from "@/lib/ai/soniox";
import { getApiUser } from "@/lib/auth/api-session";

const deny = (error: string, status: number) =>
	NextResponse.json({ error }, { status });

/**
 * Starts a live dictation: hands the browser a one-use key for the speech
 * service. 503 when live dictation isn't set up, so the browser falls back to
 * reading the note in pieces.
 */
export async function POST() {
	const user = await getApiUser();
	// Any signed-in account: studio staff and clients in the portal alike.
	if (!user) return deny("unauthorized", 401);
	if (!isLiveSpeechEnabled()) return deny("liveSpeechUnavailable", 503);
	if (!underVoiceCap("note", user.id)) return deny("dailyLimit", 429);

	const key = await mintLiveSpeechKey(user.id);
	if (!key) return deny("liveSpeechUnavailable", 503);
	return NextResponse.json(
		{ key },
		{ headers: { "Cache-Control": "no-store" } },
	);
}
