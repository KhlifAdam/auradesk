// Each list mirrors a Prisma enum.

export const SERVICE_TYPES = [
	"WEDDING",
	"ENGAGEMENT",
	"BIRTHDAY",
	"EVENT",
	"PRODUCT",
	"PORTRAIT",
	"ADVERTISING",
	"CORPORATE",
	"OTHER",
	"PFE",
	"PUB",
] as const;

/**
 * The service types offered when picking one. Corporate and Other are no
 * longer offered, but stay valid so existing records keep working.
 */
export const SERVICE_CHOICES = [
	"WEDDING",
	"ENGAGEMENT",
	"BIRTHDAY",
	"EVENT",
	"PRODUCT",
	"PORTRAIT",
	"ADVERTISING",
	"PFE",
	"PUB",
] as const;

/** The choices, plus the record's current type when it is a retired one. */
export function serviceChoices(current?: string): readonly ServiceType[] {
	return current &&
		(SERVICE_TYPES as readonly string[]).includes(current) &&
		!(SERVICE_CHOICES as readonly string[]).includes(current)
		? [...SERVICE_CHOICES, current as ServiceType]
		: SERVICE_CHOICES;
}

export const MEDIA_TYPES = ["PHOTO", "VIDEO", "BOTH"] as const;

export const LOCATION_TYPES = [
	"STUDIO",
	"OUTDOOR",
	"HOME",
	"COMPANY",
	"OTHER",
] as const;

export const PAYMENT_STATUSES = ["UNPAID", "PARTIAL", "PAID"] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];
export type MediaType = (typeof MEDIA_TYPES)[number];
export type LocationType = (typeof LOCATION_TYPES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Prices are in Tunisian dinars. */
export const CURRENCY = "TND";
