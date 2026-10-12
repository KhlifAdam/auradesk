import type { PageMeta } from "@/services/shared/pagination";

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
	itemCount: number;
	selectedCount: number;
	shared: boolean;
	submitted: boolean;
	coverUrl: string | null;
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
	selectedCount: number;
	shared: boolean;
	submitted: boolean;
	filter: GalleryFilter;
	/** Full-quality files and downloads; otherwise previews only. */
	originals: boolean;
	items: GalleryPhoto[];
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
