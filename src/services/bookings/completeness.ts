/**
 * What a booking must have before it can become a project: a way to reach the
 * client (email or phone), the price, then when and where.
 */
export type RequiredField =
	| "clientContact"
	| "proposedPrice"
	| "desiredDate"
	| "startTime"
	| "location";

/** Needed to log a booking at all; the client invitation goes through them. */
export const SAVE_FIELDS = ["clientContact", "proposedPrice"] as const;

/** Only needed to confirm; the client may fill them in. */
export const CONFIRM_FIELDS = ["desiredDate", "startTime", "location"] as const;

export interface Completeness {
	required: RequiredField[];
}

interface CompletenessInput {
	desiredDate: unknown;
	proposedPrice: unknown;
	clientEmail?: string | null;
	clientPhone?: string | null;
	location?: string | null;
	startTime?: string | null;
}

const isBlank = (value: unknown) =>
	value === null || value === undefined || value === "";

const hasContact = (
	input: Pick<CompletenessInput, "clientEmail" | "clientPhone">,
) => !isBlank(input.clientEmail?.trim()) || !isBlank(input.clientPhone?.trim());

/**
 * The single rule for "is this booking ready to confirm": the server checks
 * it before creating the project, and the pages use it to show what is left.
 */
export function bookingCompleteness(
	input: CompletenessInput,
	/** The client's own view: the studio's contact record is not theirs to fix. */
	options: { forClient?: boolean } = {},
): Completeness {
	const required: RequiredField[] = [];
	if (!options.forClient && !hasContact(input)) required.push("clientContact");
	if (isBlank(input.proposedPrice)) required.push("proposedPrice");
	if (isBlank(input.desiredDate)) required.push("desiredDate");
	if (isBlank(input.startTime)) required.push("startTime");
	if (isBlank(input.location)) required.push("location");

	return { required };
}

/**
 * What the photographer must have to log a request: who it is, a way to reach
 * them (the request is sent there) and the price. Date, time and place may
 * come from the client, so they only block confirming, not saving.
 */
export function canSaveBooking(input: {
	clientName: string;
	clientEmail?: string | null;
	clientPhone?: string | null;
	proposedPrice: unknown;
}) {
	return (
		input.clientName.trim() !== "" &&
		hasContact(input) &&
		typeof input.proposedPrice === "number"
	);
}
