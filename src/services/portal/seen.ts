import "server-only";

import { db } from "@/lib/db";
import { type ClientIdentity, clientBookingWhere } from "./booking-queries";

/**
 * Opening something takes it off the nav badges and its card's highlight:
 * everything changed until now has been seen.
 */
const now = () => ({ clientSeenAt: new Date() });

export const markProjectSeen = (clientId: string, id: string) =>
	db.project.updateMany({ where: { id, clientId }, data: now() });

export const markBookingSeen = (user: ClientIdentity, id: string) =>
	db.booking.updateMany({
		where: { id, ...clientBookingWhere(user) },
		data: now(),
	});

export const markInvoiceSeen = (clientId: string, id: string) =>
	db.invoice.updateMany({
		where: { id, clientId, clientSeenAt: null },
		data: now(),
	});

export const markQuoteSeen = (clientId: string, id: string) =>
	db.quote.updateMany({
		where: { id, clientId, clientSeenAt: null },
		data: now(),
	});

/** The studio opened it: what the client changed is now seen. */
export const markBookingSeenByStudio = (photographerId: string, id: string) =>
	db.booking.updateMany({
		where: { id, photographerId },
		data: { studioSeenAt: new Date() },
	});

export const markProjectSeenByStudio = (photographerId: string, id: string) =>
	db.project.updateMany({
		where: { id, photographerId },
		data: { studioSeenAt: new Date() },
	});
