import type { ChangeMark } from "@/components/shared/change-mark";
import type { MediaType, ServiceType } from "@/services/projects/options";
import type { PageMeta } from "@/services/shared/pagination";
import type { BookingSource, BookingStatus } from "./options";

export interface BookingSummary {
	id: string;
	title: string;
	status: BookingStatus;
	clientName: string;
	serviceType: ServiceType;
	desiredDate: string | null;
	proposedPrice: number | null;
	createdAt: string;
	/** Something required to confirm is still missing. */
	incomplete: boolean;
	/** A new request or a change by the client the studio hasn't opened. */
	mark: ChangeMark;
}

export interface BookingActivityItem {
	id: string;
	kind:
		| "CREATED"
		| "STATUS"
		| "NOTE"
		| "SENT"
		| "CLIENT_EDIT"
		| "CLIENT_ACCEPT"
		| "CLIENT_DECLINE";
	fromStatus: BookingStatus | null;
	toStatus: BookingStatus | null;
	body: string;
	createdAt: string;
}

export interface BookingDetail extends BookingSummary {
	source: BookingSource;
	clientId: string | null;
	clientEmail: string;
	clientPhone: string;
	mediaType: MediaType;
	description: string;
	startTime: string;
	durationMinutes: number | null;
	location: string;
	clientBudget: number | null;
	plannedAdvance: number | null;
	responseDeadline: string | null;
	internalNotes: string;
	statusReason: string;
	confirmedAt: string | null;
	/** When the request was sent to the client, if it was. */
	sentToClientAt: string | null;
	/** When the client accepted the proposal, if they did. */
	clientAcceptedAt: string | null;
	project: { id: string; title: string } | null;
	activities: BookingActivityItem[];
}

export interface BookingPage extends PageMeta {
	items: BookingSummary[];
}

export type BookingStats = Record<
	"total" | "pending" | "confirmed" | "closed",
	number
>;
