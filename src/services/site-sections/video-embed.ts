/** Hosts a showreel link may point to; the site embeds their player. */
export const VIDEO_EMBED_ORIGINS = [
	"https://www.youtube-nocookie.com",
	"https://player.vimeo.com",
] as const;

const YOUTUBE_ID = /^[\w-]{11}$/;
const VIMEO_ID = /^\d+$/;

/**
 * The embeddable player address for a YouTube or Vimeo link, or null when the
 * link is neither. YouTube uses its no-cookie domain.
 */
export function toVideoEmbed(link: string): string | null {
	let url: URL;
	try {
		url = new URL(link);
	} catch {
		return null;
	}
	const host = url.hostname.replace(/^(www\.|m\.)/, "");

	let youtube: string | null = null;
	if (host === "youtu.be") youtube = url.pathname.slice(1);
	else if (host === "youtube.com")
		youtube =
			url.searchParams.get("v") ??
			url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ??
			null;
	if (youtube && YOUTUBE_ID.test(youtube))
		return `${VIDEO_EMBED_ORIGINS[0]}/embed/${youtube}`;

	if (host === "vimeo.com" || host === "player.vimeo.com") {
		const id = url.pathname.split("/").filter(Boolean).at(-1) ?? "";
		if (VIMEO_ID.test(id)) return `${VIDEO_EMBED_ORIGINS[1]}/video/${id}`;
	}
	return null;
}
