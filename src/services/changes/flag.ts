import "server-only";

import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import {
	type ChangeAudience,
	sendChangeEmail,
} from "@/lib/mail/send-client-notices";
import { realEmail, toE164 } from "@/lib/phone";
import { sendChangeSms } from "@/lib/sms/send-client-sms";
import { CLIENT_SOURCES } from "@/services/portal/booking-queries";
import { keepUpdate, type ProjectUpdate } from "./project-updates";

/** Which ways to tell them; some flows already send their own email. */
export interface Channels {
	email?: boolean;
	text?: boolean;
}

const ALL: Channels = { email: true, text: true };

/** A change was already waiting for them, so they were told about it. */
const waiting = (seenAt: Date | null, changedAt: Date | null) =>
	changedAt !== null && (seenAt === null || changedAt > seenAt);

const studioName = (photographer: {
	name: string;
	studio: { name: string } | null;
}) => photographer.studio?.name ?? photographer.name;

const photographerSelect = {
	select: {
		name: true,
		email: true,
		phoneNumber: true,
		locale: true,
		studio: { select: { name: true } },
	},
} as const;

const userSelect = {
	select: { name: true, email: true, phoneNumber: true, locale: true },
} as const;

interface Notice {
	email: string | null;
	phone: string | null;
	locale: string | null;
	audience: ChangeAudience;
	who: string;
	item: string;
	path: string;
}

/** Email and WhatsApp (or SMS); a failure is logged, never thrown. */
async function notify(notice: Notice, channels: Channels) {
	const { email, phone, locale: saved, ...vars } = notice;
	const locale = resolveMailLocale(saved);
	const sends: Promise<unknown>[] = [];
	if (channels.email && email)
		sends.push(sendChangeEmail({ to: email, locale, ...vars }));
	if (channels.text && phone)
		sends.push(sendChangeSms({ to: phone, locale, ...vars }));
	for (const result of await Promise.allSettled(sends))
		if (result.status === "rejected")
			console.error("Failed to send a change notice:", result.reason);
}

/**
 * The studio changed a booking: it lights up in the client's space, and they
 * are told once until they open it. Never throws.
 */
export async function flagBookingForClient(id: string, channels = ALL) {
	try {
		const booking = await db.booking.findUnique({
			where: { id },
			select: {
				title: true,
				source: true,
				sentToClientAt: true,
				clientSeenAt: true,
				clientChangedAt: true,
				clientEmail: true,
				clientPhone: true,
				client: userSelect,
				photographer: photographerSelect,
			},
		});
		if (!booking) return;
		await db.booking.update({
			where: { id },
			data: { clientChangedAt: new Date() },
		});
		const visible =
			booking.sentToClientAt !== null ||
			(CLIENT_SOURCES as readonly string[]).includes(booking.source);
		// Never opened: they were told when it was sent to them.
		if (!visible || booking.clientSeenAt === null) return;
		if (waiting(booking.clientSeenAt, booking.clientChangedAt)) return;
		await notify(
			{
				email:
					booking.clientEmail ??
					(booking.client ? realEmail(booking.client.email) : null),
				phone:
					(booking.clientPhone && toE164(booking.clientPhone)) ??
					booking.client?.phoneNumber ??
					null,
				locale: booking.client?.locale ?? booking.photographer.locale,
				audience: "changeForClient",
				who: studioName(booking.photographer),
				item: booking.title,
				path: `/portal/bookings/${id}`,
			},
			channels,
		);
	} catch (error) {
		console.error(`Failed to flag booking ${id} for the client:`, error);
	}
}

/** The studio changed a project the client has joined. Never throws. */
export async function flagProjectForClient(
	id: string,
	channels = ALL,
	update: ProjectUpdate = "details",
) {
	try {
		const project = await db.project.findUnique({
			where: { id },
			select: {
				title: true,
				clientSeenAt: true,
				clientChangedAt: true,
				clientUpdate: true,
				client: userSelect,
				photographer: photographerSelect,
			},
		});
		if (!project?.client) return;
		const unseen = waiting(project.clientSeenAt, project.clientChangedAt);
		await db.project.update({
			where: { id },
			data: {
				clientChangedAt: new Date(),
				// The client is told why when they open it.
				clientUpdate: unseen
					? keepUpdate(project.clientUpdate, update)
					: update,
			},
		});
		if (project.clientSeenAt === null) return;
		if (waiting(project.clientSeenAt, project.clientChangedAt)) return;
		await notify(
			{
				email: realEmail(project.client.email),
				phone: project.client.phoneNumber,
				locale: project.client.locale,
				audience: "changeForClient",
				who: studioName(project.photographer),
				item: project.title,
				path: `/portal/projects/${id}`,
			},
			channels,
		);
	} catch (error) {
		console.error(`Failed to flag project ${id} for the client:`, error);
	}
}

/**
 * The client changed a booking, or sent a new request: it lights up in the
 * studio's space, and the photographer is told once. Never throws.
 */
export async function flagBookingForStudio(id: string, channels = ALL) {
	try {
		const booking = await db.booking.findUnique({
			where: { id },
			select: {
				title: true,
				clientName: true,
				studioSeenAt: true,
				studioChangedAt: true,
				photographer: photographerSelect,
			},
		});
		if (!booking) return;
		await db.booking.update({
			where: { id },
			data: { studioChangedAt: new Date() },
		});
		if (waiting(booking.studioSeenAt, booking.studioChangedAt)) return;
		const { photographer } = booking;
		await notify(
			{
				email: realEmail(photographer.email),
				phone: photographer.phoneNumber,
				locale: photographer.locale,
				audience: "changeForStudio",
				who: booking.clientName,
				item: booking.title,
				path: `/dashboard/bookings/${id}`,
			},
			channels,
		);
	} catch (error) {
		console.error(`Failed to flag booking ${id} for the studio:`, error);
	}
}

/** The client did something on a project (joined, chose photos…). Never throws. */
export async function flagProjectForStudio(id: string, channels = ALL) {
	try {
		const project = await db.project.findUnique({
			where: { id },
			select: {
				title: true,
				studioSeenAt: true,
				studioChangedAt: true,
				client: userSelect,
				photographer: photographerSelect,
			},
		});
		if (!project) return;
		await db.project.update({
			where: { id },
			data: { studioChangedAt: new Date() },
		});
		if (waiting(project.studioSeenAt, project.studioChangedAt)) return;
		const { photographer } = project;
		await notify(
			{
				email: realEmail(photographer.email),
				phone: photographer.phoneNumber,
				locale: photographer.locale,
				audience: "changeForStudio",
				who: project.client?.name ?? project.title,
				item: project.title,
				path: `/dashboard/projects/${id}`,
			},
			channels,
		);
	} catch (error) {
		console.error(`Failed to flag project ${id} for the studio:`, error);
	}
}
