/**
 * Recognisers rarely write "Hey Aura" as such: they hear "hey order", "hey
 * hora", "et Aurore", "heyora"... So we look for a greeting followed by any
 * word that sounds like "Aura", rather than for the exact phrase.
 */

/** "Hey" as English and French recognisers write it. */
const GREETING = new Set([
	"hey",
	"hay",
	"hi",
	"he",
	"eh",
	"ey",
	"et",
	"ok",
	"okay",
]);

/**
 * Sounds like "Aura": an optional h/l/d, an "o" sound, an "r", then an
 * optional ending. Matches aura, ora, hora, laura, dora, order, aurore, horah.
 */
const AURA = /^[hld]?(?:au|aw|ou|o)r+(?:a|ah|e|er|der|re|o|ore)?$/;

/** The greeting and the name run together: "heyaura", "hayora". */
const JOINED = /^(?:hey|hay|he)(?:au|o)r+(?:a|ah|e|er)?$/;

/** Lower case, no accents ("hé" → "he"), punctuation turned into spaces. */
const words = (text: string) =>
	text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z']+/g, " ")
		.trim()
		.split(" ")
		.filter(Boolean);

/** True when the text contains "Hey Aura", however it was written down. */
export function heardWakePhrase(text: string): boolean {
	const list = words(text);
	return list.some(
		(word, i) =>
			JOINED.test(word) || (GREETING.has(word) && AURA.test(list[i + 1] ?? "")),
	);
}
