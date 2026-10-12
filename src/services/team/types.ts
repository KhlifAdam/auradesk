import type { EquipmentBookingKind } from "@/services/equipment/options";
import type {
	LocationType,
	MediaType,
	ServiceType,
} from "@/services/projects/options";
import type { ProjectStage } from "@/services/projects/stages";
import type { PageMeta } from "@/services/shared/pagination";

export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface TeamMemberSummary {
	id: string;
	name: string;
	email: string;
	specialty: string;
	status: InviteStatus;
	invitedAt: string;
	/** Projects they're on. */
	projectCount: number;
}

export interface TeamPage extends PageMeta {
	items: TeamMemberSummary[];
}

export interface ProjectAssignmentItem {
	id: string;
	role: string;
	member: { id: string; name: string; specialty: string; status: InviteStatus };
}

/** An invitation waiting for the signed-in collaborator's answer. */
export interface TeamInvitation {
	id: string;
	studioName: string;
	specialty: string;
	invitedAt: string;
}

/** A project as a collaborator sees it: the job, never the money. */
export interface AssignedProjectSummary {
	id: string;
	title: string;
	studioName: string;
	role: string;
	stage: ProjectStage;
	eventDate: string | null;
	location: string;
}

export interface AssignedProjectPage extends PageMeta {
	items: AssignedProjectSummary[];
}

export interface AssignedProjectDetail extends AssignedProjectSummary {
	description: string;
	serviceType: ServiceType;
	mediaType: MediaType;
	startTime: string;
	endTime: string;
	locationType: LocationType | null;
	deliveryDeadline: string | null;
	/** On-site contact, so the crew can reach someone on the day. */
	contactName: string;
	contactPhone: string;
	team: { name: string; specialty: string; role: string }[];
	gear: {
		name: string;
		kind: EquipmentBookingKind;
		startDate: string;
		endDate: string;
	}[];
}
