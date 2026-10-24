import type { BookingSummary } from "@/services/bookings/types";
import type { InvoiceSummary } from "@/services/invoices/types";
import type { ProjectSummary } from "@/services/projects/types";

/**
 * Lean rows the tools return: enough for the cards to draw and for the model
 * to reason with, without filling its context with every column.
 */
export function toProjectRow(project: ProjectSummary) {
	return {
		id: project.id,
		title: project.title,
		stage: project.stage,
		serviceType: project.serviceType,
		eventDate: project.eventDate,
		clientName: project.client.name ?? project.client.email ?? "",
		paymentStatus: project.paymentStatus,
		price: project.price,
		galleryCount: project.galleryCount,
	};
}

export function toBookingRow(booking: BookingSummary) {
	return {
		id: booking.id,
		title: booking.title,
		status: booking.status,
		clientName: booking.clientName,
		serviceType: booking.serviceType,
		desiredDate: booking.desiredDate,
		proposedPrice: booking.proposedPrice,
	};
}

export function toInvoiceRow(invoice: InvoiceSummary) {
	return {
		id: invoice.id,
		number: invoice.number,
		status: invoice.displayStatus,
		clientName: invoice.clientName,
		total: invoice.total,
		balance: invoice.balance,
		dueDate: invoice.dueDate,
	};
}

export type ProjectRow = ReturnType<typeof toProjectRow>;
export type BookingRow = ReturnType<typeof toBookingRow>;
export type InvoiceRow = ReturnType<typeof toInvoiceRow>;

/** A page of rows, with what's needed to say "12 of 40". */
export interface RowPage<T> {
	items: T[];
	page: number;
	pageCount: number;
	total: number;
}

export function toRowPage<S, T>(
	page: { items: S[]; page: number; pageCount: number; total: number },
	map: (item: S) => T,
): RowPage<T> {
	return {
		items: page.items.map(map),
		page: page.page,
		pageCount: page.pageCount,
		total: page.total,
	};
}
