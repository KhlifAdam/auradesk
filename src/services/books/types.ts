import type { BookDesign } from "@/lib/books/design";
import type { BookOrderOptions, PriceList, Quote } from "@/lib/books/pricing";

/** A delivered photo as the book editor needs it: a light copy to show, and its size. */
export interface BookPhoto {
	id: string;
	/** A preview, never the original: the PDF reads the original on the server. */
	url: string;
	width: number | null;
	height: number | null;
	filename: string;
}

export interface BookPhotoPage {
	items: BookPhoto[];
	page: number;
	pageCount: number;
	total: number;
}

/** Where a book stands: designed by the client, then ordered from the studio. */
export const BOOK_STATUSES = [
	"DRAFT",
	"SUBMITTED",
	"ACCEPTED",
	"IN_PRODUCTION",
	"READY",
	"DELIVERED",
] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

/** The statuses a studio sees: an order exists once it is sent. */
export const ORDER_STATUSES = [
	"SUBMITTED",
	"ACCEPTED",
	"IN_PRODUCTION",
	"READY",
	"DELIVERED",
] as const;

export interface BookSummary {
	id: string;
	title: string;
	status: BookStatus;
	/** Pages inside, not counting the cover. */
	pageCount: number;
	updatedAt: string;
	coverUrl: string | null;
}

/** The invoice a book order is billed on. */
export interface BookInvoice {
	id: string;
	number: string;
	status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
	total: number;
	paid: number;
}

/** Everything about the order side of a book. */
export interface BookOrder {
	status: BookStatus;
	copies: number;
	options: BookOrderOptions | null;
	clientNote: string;
	quote: Quote | null;
	/** What the studio charges; the quote unless it adjusted it. */
	total: number | null;
	/** The studio's note when it sent the book back. */
	statusNote: string;
	submittedAt: string | null;
	invoice: BookInvoice | null;
}

export interface BookView {
	id: string;
	projectId: string;
	projectTitle: string;
	studioName: string;
	design: BookDesign;
	/** The photos the design uses, by id. */
	photos: Record<string, BookPhoto>;
	order: BookOrder;
	/** The studio's prices, to quote as the client chooses. */
	priceList: PriceList;
}

/** A row in the studio's list of book orders. */
export interface StudioOrderSummary {
	id: string;
	title: string;
	status: BookStatus;
	clientName: string;
	projectTitle: string;
	pages: number;
	copies: number;
	total: number | null;
	submittedAt: string | null;
	invoice: Pick<BookInvoice, "number" | "status"> | null;
}

export interface StudioOrderPage {
	items: StudioOrderSummary[];
	page: number;
	pageCount: number;
	total: number;
}

/** One order as the studio works on it. */
export interface StudioOrderDetail {
	id: string;
	projectId: string;
	projectTitle: string;
	client: { id: string; name: string; email: string; phone: string };
	design: BookDesign;
	photos: Record<string, BookPhoto>;
	order: BookOrder;
	priceList: PriceList;
}
