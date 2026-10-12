// Mirrors the Prisma enums.

export const EQUIPMENT_CATEGORIES = [
	"CAMERA",
	"LENS",
	"LIGHTING",
	"AUDIO",
	"DRONE",
	"SUPPORT",
	"STORAGE",
	"COMPUTER",
	"OTHER",
] as const;

export const EQUIPMENT_STATUSES = ["ACTIVE", "BROKEN", "RETIRED"] as const;

export const EQUIPMENT_OWNERSHIPS = ["OWNED", "HIRED"] as const;

export const EQUIPMENT_BOOKING_KINDS = [
	"PROJECT",
	"RENTAL_OUT",
	"RENTAL_IN",
	"MAINTENANCE",
] as const;

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];
export type EquipmentOwnership = (typeof EQUIPMENT_OWNERSHIPS)[number];
export type EquipmentBookingKind = (typeof EQUIPMENT_BOOKING_KINDS)[number];

/**
 * A hire from a supplier is a record of the period and its cost; it doesn't
 * keep the item busy. Every other kind does.
 */
export const BLOCKING_KINDS = [
	"PROJECT",
	"RENTAL_OUT",
	"MAINTENANCE",
] as const satisfies EquipmentBookingKind[];

/** Where an item is right now. */
export type Availability =
	| "AVAILABLE"
	| "IN_USE"
	| "RENTED_OUT"
	| "IN_MAINTENANCE"
	| "BROKEN"
	| "RETIRED";

export const AVAILABILITY_FILTERS = [
	"AVAILABLE",
	"BUSY",
	"BROKEN",
	"RETIRED",
] as const;

export function availabilityOf(
	status: EquipmentStatus,
	current: EquipmentBookingKind | null,
): Availability {
	if (status !== "ACTIVE") return status;
	if (current === "PROJECT") return "IN_USE";
	if (current === "RENTAL_OUT") return "RENTED_OUT";
	if (current === "MAINTENANCE") return "IN_MAINTENANCE";
	return "AVAILABLE";
}

/** Today at UTC midnight: booking days are stored that way. */
export function todayUtc(now = new Date()) {
	return new Date(now.toISOString().slice(0, 10));
}
