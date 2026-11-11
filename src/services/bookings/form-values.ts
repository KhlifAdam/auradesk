import type { BookingQuote } from "./booking-quote";
import type { BookingValues } from "./schemas";
import type { BookingDetail } from "./types";

export function emptyBookingValues(
	prefill: Partial<BookingValues> = {},
): BookingValues {
	return {
		title: "",
		source: "OTHER",
		clientId: "",
		clientName: "",
		clientEmail: "",
		clientPhone: "",
		serviceType: "WEDDING",
		mediaType: "PHOTO",
		description: "",
		desiredDate: "",
		startTime: "",
		durationHours: null,
		location: "",
		clientBudget: null,
		proposedPrice: null,
		plannedAdvance: null,
		responseDeadline: "",
		internalNotes: "",
		items: [{ description: "", quantity: 1, unitPrice: null }],
		discount: null,
		taxRate: null,
		...prefill,
	};
}

const day = (iso: string | null) => iso?.slice(0, 10) ?? "";

/**
 * The booking, with its quote's lines; without one, a single line for the
 * service sold (`serviceLabel`, e.g. "Wedding") at its price.
 */
export function bookingToValues(
	booking: BookingDetail,
	quote: BookingQuote | null,
	serviceLabel: string,
): BookingValues {
	return {
		title: booking.title,
		source: booking.source,
		clientId: booking.clientId ?? "",
		clientName: booking.clientName,
		clientEmail: booking.clientEmail,
		clientPhone: booking.clientPhone,
		serviceType: booking.serviceType,
		mediaType: booking.mediaType,
		description: booking.description,
		desiredDate: day(booking.desiredDate),
		startTime: booking.startTime,
		durationHours: booking.durationMinutes
			? booking.durationMinutes / 60
			: null,
		location: booking.location,
		clientBudget: booking.clientBudget,
		proposedPrice: booking.proposedPrice,
		plannedAdvance: booking.plannedAdvance,
		responseDeadline: day(booking.responseDeadline),
		internalNotes: booking.internalNotes,
		items: quote?.lines.length
			? quote.lines
			: [
					{
						description: serviceLabel,
						quantity: 1,
						unitPrice: booking.proposedPrice,
					},
				],
		discount: quote?.discount || null,
		taxRate: quote?.taxRate || null,
	};
}
