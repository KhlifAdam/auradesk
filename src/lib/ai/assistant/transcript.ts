/**
 * Tidies a speech-to-text result. Models describe noises ("*thud*",
 * "[Music]") or trail off into dots when the end of a recording is quiet;
 * neither was said, and nobody dictates them.
 */
export function cleanTranscript(text: string) {
	return (
		text
			// A noise is wrapped tight: "*thud*", not "2 * 3 et 4 * 5".
			.replace(/\*(?!\s)[^*\n]{1,40}(?<!\s)\*/g, " ")
			.replace(/\[[^\]\n]{1,40}\]/g, " ")
			// A lone dot left after a sentence that already ended.
			.replace(/([.?!])(\s+\.)+(?=\s|$)/g, "$1")
			.replace(/(\s*\.{2,}|\s*…)+\s*$/g, "")
			.replace(/(\S)\s+([.?!])(?=\s|$)/g, "$1$2")
			.replace(/\s+/g, " ")
			.trim()
	);
}
