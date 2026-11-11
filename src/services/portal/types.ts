import type { ChangeMark } from "@/components/shared/change-mark";
import type { ProjectUpdate } from "@/services/changes/project-updates";
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
	/** New to the client, or changed by the studio since they opened it. */
	mark: ChangeMark;
	/** Why it is marked "updated": what the studio changed since they last looked. */
	update: ProjectUpdate | null;
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
	/** Discounts granted on the project's issued invoices. */
	discount: number;
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
