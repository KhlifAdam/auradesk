import "server-only";

import type { Media } from "@/generated/prisma/client";
import { publicUrl } from "@/lib/storage/r2";
import type { SiteMedia } from "./types";

const FALLBACK_SIZE = { width: 1500, height: 1000 };

/** A library item as the public site uses it: plain JSON, public URL. */
export function toSiteMedia(media: Media): SiteMedia {
	return {
		id: media.id,
		type: media.type,
		url: publicUrl(media.key),
		alt: media.alt ?? "",
		width: media.width ?? FALLBACK_SIZE.width,
		height: media.height ?? FALLBACK_SIZE.height,
	};
}
