import type { PageMeta } from "@/services/shared/pagination";

/** PROOFS: light copies to choose from. FINAL: the delivered photos. */
export type GalleryKind = "PROOFS" | "FINAL";

/** A gallery photo or video with short-lived signed URLs. */
export interface GalleryPhoto {
	id: string;
	type: "IMAGE" | "VIDEO";
	filename: string;
	/** Seconds, for videos. */
	durationSec: number | null;
	width: number | null;
	height: number | null;
	selected: boolean;
	commentCount: number;
	/** Null for a video whose poster couldn't be made in the browser. */
	previewUrl: string | null;
	/** The original; for a client before delivery, the preview (or null). */
	fullUrl: string | null;
	/** What the AI assistant flagged; only ever sent to the photographer. */
	flags: string[];
}

export interface GallerySummary {
	id: string;
	title: string;
	kind: GalleryKind;
	/** Its cover, drawn small on the card in the chosen layout. */
	cover: GalleryCoverData;
	itemCount: number;
	selectedCount: number;
	shared: boolean;
	submitted: boolean;
	coverUrl: string | null;
	/** Delivered as a Google Drive link instead of files. */
	isLink: boolean;
}

/** `flagged` (photos the AI assistant flagged) is for the photographer only. */
export type GalleryFilter = "all" | "selected" | "flagged";

export interface GalleryView extends PageMeta {
	id: string;
	projectId: string;
	projectTitle: string;
	title: string;
	description: string;
	selectionEnabled: boolean;
	selectionLimit: number | null;
	kind: GalleryKind;
	/** Proofing previews carry the studio's mark. */
	watermark: boolean;
	studioName: string | null;
	cover: GalleryCoverData;
	/** The photographer lets the client share a view-only link. */
	linkSharing: boolean;
	/** The client's active share link; never sent to link visitors. */
	share: GalleryShare | null;
	selectedCount: number;
	shared: boolean;
	submitted: boolean;
	filter: GalleryFilter;
	/** Full-quality files and downloads; otherwise previews only. */
	originals: boolean;
	/** Delivered as a Google Drive link instead of files. */
	isLink: boolean;
	/** The link itself: for the owner, and for the client once delivered and paid. */
	externalUrl: string | null;
	items: GalleryPhoto[];
}

export type CoverTemplate = "CLASSIC" | "SPLIT" | "FRAME" | "NONE";

/** The cover page at the top of the gallery, as the viewer gets it. */
export interface GalleryCoverData {
	template: CoverTemplate;
	/** The photo used (chosen, or the first one); null for an empty gallery. */
	itemId: string | null;
	imageUrl: string | null;
	/** Point kept in frame when the photo is cropped, 0 to 1. */
	focalX: number;
	focalY: number;
	/** The project's event date (ISO), shown under the title. */
	date: string | null;
}

export interface GalleryShare {
	token: string;
	/** Link visitors may download (once delivered and paid). */
	downloads: boolean;
	expiresAt: string | null;
}

export interface GalleryComment {
	id: string;
	body: string;
	authorName: string;
	/** True when written by the photographer who owns the gallery. */
	byPhotographer: boolean;
	mine: boolean;
	createdAt: string;
}
