/** What a booking must have before it can become a project: when, where, who to reach, how much. */
export type RequiredField =
	| "desiredDate"
	| "startTime"
	| "location"
	| "clientEmail"
	| "clientPhone"
	| "proposedPrice";

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

/**
 * The single rule for "is this booking ready to confirm": the server checks
 * it before creating the project, and the pages use it to show what is left.
 */
export function bookingCompleteness(
	input: CompletenessInput,
	/** The client's own view: the studio's record of their email is not theirs to fix. */
	options: { forClient?: boolean } = {},
): Completeness {
	const required: RequiredField[] = [];
	if (isBlank(input.desiredDate)) required.push("desiredDate");
	if (isBlank(input.startTime)) required.push("startTime");
	if (isBlank(input.location)) required.push("location");
	if (!options.forClient && isBlank(input.clientEmail))
		required.push("clientEmail");
	if (isBlank(input.clientPhone)) required.push("clientPhone");
	if (isBlank(input.proposedPrice)) required.push("proposedPrice");

	return { required };
}

/**
 * What the photographer must have to log a request: who it is and the price.
 * The rest (date, time, place, phone) may come from the client, so it only
 * blocks confirming, not saving.
 */
export function canSaveBooking(input: {
	clientName: string;
	proposedPrice: unknown;
}) {
	return (
		input.clientName.trim() !== "" && typeof input.proposedPrice === "number"
	);
}
