import type { PageMeta } from "@/services/shared/pagination";

/** Where a conversation happens: the studio (dashboard, team space) or the client portal. */
export type AssistantSpace = "studio" | "portal";

export interface ThreadSummary {
	id: string;
	title: string;
	updatedAt: string;
}

export interface ThreadPage extends PageMeta {
	items: ThreadSummary[];
}

/** A few photos of a project, for a card the user expanded. */
export interface MediaPreview {
	galleryId: string | null;
	total: number;
	items: { id: string; url: string; filename: string; isVideo: boolean }[];
}

/** What an action card shows about the thing it will change. */
export interface ActionTarget {
	title: string;
	subtitle: string;
	href: string | null;
}
