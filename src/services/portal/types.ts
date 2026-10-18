import type { StudioBrand } from "@/services/clients/branding";
import type { GallerySummary } from "@/services/galleries/types";
import type {
	LocationType,
	MediaType,
	PaymentStatus,
	ServiceType,
} from "@/services/projects/options";
import type { ProjectStage } from "@/services/projects/stages";
import type { PageMeta } from "@/services/shared/pagination";

export interface PortalProject {
	id: string;
	title: string;
	photographerId: string;
	stage: ProjectStage;
	eventDate: string | null;
	location: string;
	studio: StudioBrand | null;
	photographerName: string;
	sharedGalleryCount: number;
}

export interface PortalProjectDetail extends PortalProject {
	description: string;
	serviceType: ServiceType;
	mediaType: MediaType;
	/** Local `HH:mm`, or empty. */
	startTime: string;
	endTime: string;
	locationType: LocationType | null;
	deliveryDeadline: string | null;
	price: number | null;
	advance: number;
	paymentStatus: PaymentStatus;
	/** Delivered and paid: the files are visible and can be downloaded. */
	delivered: boolean;
	/** When the studio's retention deletes the galleries; null if never. */
	galleriesDeleteAt: string | null;
	galleries: GallerySummary[];
}

export interface PortalProjectPage extends PageMeta {
	items: PortalProject[];
}
