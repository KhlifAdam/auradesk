import { z } from "zod";
import { searchQuerySchema } from "@/services/clients/schemas";
import { MEDIA_TYPES, SERVICE_TYPES } from "@/services/projects/options";
import {
	dateInput,
	idSchema,
	moneyAmount,
	optionalEmail,
	optionalText,
	requiredText,
	timeInput,
} from "@/services/shared/schemas";
import { BOOKING_SOURCES, BOOKING_STATUSES, OPEN_STATUSES } from "./options";

export const BOOKING_PAGE_SIZE = 20;
const MAX_DURATION_HOURS = 24;

export const bookingStatusSchema = z.enum(BOOKING_STATUSES);

const bookingFields = {
	title: optionalText(120),
	source: z.enum(BOOKING_SOURCES),
	// Client: an existing one (`clientId`) or just contact details.
	clientId: z.string(),
	clientName: requiredText(120),
	clientEmail: optionalEmail,
	clientPhone: optionalText(40),
	// The need
	serviceType: z.enum(SERVICE_TYPES),
	mediaType: z.enum(MEDIA_TYPES),
	description: optionalText(2000),
	desiredDate: dateInput,
	startTime: timeInput,
	/** Hours, as typed; stored as minutes. */
	durationHours: z
		.number("invalidNumber")
		.positive("invalidNumber")
		.max(MAX_DURATION_HOURS, "invalidNumber")
		.nullable(),
	location: optionalText(300),
	// Money, in TND
	clientBudget: moneyAmount,
	proposedPrice: moneyAmount,
	plannedAdvance: moneyAmount,
	responseDeadline: dateInput,
	internalNotes: optionalText(2000),
};

const baseSchema = z.object(bookingFields);

function checkBookingRules(
	v: z.infer<typeof baseSchema>,
	ctx: z.RefinementCtx,
) {
	if (
		v.proposedPrice !== null &&
		v.plannedAdvance !== null &&
		v.plannedAdvance > v.proposedPrice
	)
		ctx.addIssue({
			code: "custom",
			path: ["plannedAdvance"],
			message: "advanceTooHigh",
		});
}

export const bookingSchema = baseSchema.superRefine(checkBookingRules);

/** The details a client can fill in or correct on a request sent to them. */
export const clientEditSchema = baseSchema
	.pick({
		clientName: true,
		clientPhone: true,
		serviceType: true,
		mediaType: true,
		description: true,
		desiredDate: true,
		startTime: true,
		durationHours: true,
		location: true,
		clientBudget: true,
	})
	.extend({ id: idSchema });

/** Confirming before the client accepted needs the photographer to say so. */
export const confirmBookingSchema = z.object({
	id: idSchema,
	withoutClient: z.boolean(),
});

export const clientAnswerSchema = z.object({
	id: idSchema,
	accept: z.boolean(),
	reason: optionalText(500),
});

export const updateBookingSchema = baseSchema
	.extend({ id: idSchema })
	.superRefine(checkBookingRules);

export const setStatusSchema = z.object({
	id: idSchema,
	status: z.enum(OPEN_STATUSES),
});

export const declineSchema = z.object({
	id: idSchema,
	reason: optionalText(500),
});

export const noteSchema = z.object({
	id: idSchema,
	body: requiredText(2000),
});

export const listBookingsSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	q: searchQuerySchema,
	status: bookingStatusSchema.optional().catch(undefined),
});

/** The public site's request form: no account, so a few plain fields. */
export const publicRequestSchema = z.object({
	slug: z.string().min(1).max(60),
	name: requiredText(120),
	email: z.email("invalidEmail"),
	phone: optionalText(40),
	serviceType: z.enum(SERVICE_TYPES),
	desiredDate: dateInput,
	message: requiredText(2000),
	/** Honeypot: humans leave it empty. */
	website: z.string().max(0).optional(),
});

/** A client asks a studio they already work with for a new service. */
export const portalRequestSchema = z.object({
	photographerId: idSchema,
	serviceType: z.enum(SERVICE_TYPES),
	desiredDate: dateInput,
	location: optionalText(300),
	message: requiredText(2000),
});

export type BookingValues = z.infer<typeof bookingSchema>;
export type PortalRequestValues = z.infer<typeof portalRequestSchema>;
export type ClientEditValues = z.infer<typeof clientEditSchema>;
export type ListBookingsParams = z.infer<typeof listBookingsSchema>;
export type PublicRequestValues = z.infer<typeof publicRequestSchema>;
