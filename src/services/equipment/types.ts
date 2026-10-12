import type { PageMeta } from "@/services/shared/pagination";
import type {
	Availability,
	EquipmentBookingKind,
	EquipmentCategory,
	EquipmentOwnership,
	EquipmentStatus,
} from "./options";

export interface EquipmentBookingItem {
	id: string;
	equipmentId: string;
	equipmentName: string;
	kind: EquipmentBookingKind;
	startDate: string;
	endDate: string;
	project: { id: string; title: string } | null;
	partyName: string;
	amount: number | null;
	notes: string;
	returnedAt: string | null;
}

export interface EquipmentSummary {
	id: string;
	name: string;
	category: EquipmentCategory;
	brand: string;
	model: string;
	status: EquipmentStatus;
	ownership: EquipmentOwnership;
	availability: Availability;
	/** The next booking that keeps it busy, from today on. */
	nextBooking: {
		startDate: string;
		endDate: string;
		kind: EquipmentBookingKind;
	} | null;
}

export interface EquipmentDetail extends EquipmentSummary {
	serialNumber: string;
	purchaseDate: string | null;
	purchasePrice: number | null;
	dailyRate: number | null;
	notes: string;
	/** Fees received from renting it out, all time. */
	rentalIncome: number;
}

export interface EquipmentPage extends PageMeta {
	items: EquipmentSummary[];
}

export interface EquipmentBookingPage extends PageMeta {
	items: EquipmentBookingItem[];
}

export type EquipmentStats = Record<
	"total" | "available" | "busy" | "unavailable",
	number
>;
