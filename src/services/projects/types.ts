import type { ChangeMark } from "@/components/shared/change-mark";
import type { GallerySummary } from "@/services/galleries/types";
import type { PageMeta } from "@/services/shared/pagination";
import type {
	LocationType,
	MediaType,
	PaymentStatus,
	ServiceType,
} from "./options";
import type { ProjectStage } from "./stages";

export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED";

/** Who the project is for: the accepted client, or the pending/declined invite. */
export interface ProjectClient {
	/** Set once the invitation is accepted. */
	id: string | null;
	name: string | null;
	email: string | null;
	/** E.164; set for phone-only clients and phone invitations. */
	phone: string | null;
	status: InviteStatus | null;
}

export interface ProjectSummary {
	id: string;
	title: string;
	stage: ProjectStage;
	serviceType: ServiceType;
	mediaType: MediaType;
	eventDate: string | null;
	location: string;
	client: ProjectClient;
	price: number | null;
	advance: number;
	paymentStatus: PaymentStatus;
	galleryCount: number;
	updatedAt: string;
	/** Something the client did that the studio hasn't opened yet. */
	mark: ChangeMark;
}

export interface ProjectDetail extends ProjectSummary {
	description: string;
	/** The confirmed booking this project came from. */
	bookingId: string | null;
	clientPhone: string;
	contactName: string;
	contactPhone: string;
	clientNotes: string;
	startTime: string;
	endTime: string;
	locationType: LocationType | "";
	deliveryDeadline: string | null;
	equipment: string;
	financialNotes: string;
	/** Discounts granted on the project's issued invoices. */
	discount: number;
	team: string;
	internalNotes: string;
	galleries: GallerySummary[];
}

export interface ProjectPage extends PageMeta {
	items: ProjectSummary[];
}
