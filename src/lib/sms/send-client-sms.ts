import "server-only";

import { env } from "@/lib/env";
import { sendSms } from "./send-sms";

const appUrl = (path: string) =>
	`${env.BETTER_AUTH_URL.replace(/\/$/, "")}${path}`;

type Locale = string | null | undefined;

/** One-time code for signing in with a phone number. */
export function sendOtpSms(props: {
	to: string;
	locale: Locale;
	code: string;
	expiresInMinutes: number;
}) {
	const { to, locale, code, expiresInMinutes } = props;
	return sendSms({
		to,
		locale,
		kind: "otp",
		vars: {
			code,
			minutes: String(expiresInMinutes),
		},
	});
}

/** Project invitation for someone reachable only by phone. */
export function sendProjectInvitationSms(props: {
	to: string;
	locale: Locale;
	studio: string;
	project: string;
}) {
	const { to, locale, studio, project } = props;
	return sendSms({
		to,
		locale,
		kind: "projectInvitation",
		vars: {
			studio,
			project,
			url: appUrl(`/client/phone?phone=${encodeURIComponent(to)}`),
		},
	});
}

/** A gallery became visible to a phone-only client. */
export function sendGallerySharedSms(props: {
	to: string;
	locale: Locale;
	studio: string;
	gallery: string;
	galleryId: string;
}) {
	const { to, locale, galleryId, ...vars } = props;
	return sendSms({
		to,
		locale,
		kind: "galleryShared",
		vars: {
			...vars,
			url: appUrl(`/portal/galleries/${galleryId}`),
		},
	});
}

/** A new message for a phone-only user. */
export function sendNewMessageSms(props: {
	to: string;
	locale: Locale;
	sender: string;
	path: string;
}) {
	const { to, locale, sender, path } = props;
	return sendSms({
		to,
		locale,
		kind: "newMessage",
		vars: { sender, url: appUrl(path) },
	});
}

/** A booking request sent to a client who has no email. */
export function sendBookingSentSms(props: {
	to: string;
	locale: Locale;
	studio: string;
	booking: string;
	path: string;
}) {
	const { to, locale, path, ...vars } = props;
	return sendSms({
		to,
		locale,
		kind: "bookingSent",
		vars: { ...vars, url: appUrl(path) },
	});
}

/** Booking confirmed and project ready, for a phone-only client. */
export function sendProjectCreatedSms(props: {
	to: string;
	locale: Locale;
	studio: string;
	project: string;
	path: string;
}) {
	const { to, locale, path, ...vars } = props;
	return sendSms({
		to,
		locale,
		kind: "projectCreated",
		vars: { ...vars, url: appUrl(path) },
	});
}

/** Galleries open for choosing, or the project delivered, for a phone-only client. */
export function sendProjectStageSms(props: {
	to: string;
	locale: Locale;
	kind: "galleriesReady" | "projectDelivered";
	studio: string;
	project: string;
	projectId: string;
}) {
	const { to, locale, kind, projectId, ...vars } = props;
	return sendSms({
		to,
		locale,
		kind,
		vars: {
			...vars,
			url: appUrl(`/portal/projects/${projectId}`),
		},
	});
}

/** Something changed on a booking or project (by WhatsApp when it is linked). */
export function sendChangeSms(props: {
	to: string;
	locale: Locale;
	audience: "changeForClient" | "changeForStudio";
	who: string;
	item: string;
	path: string;
}) {
	const { to, locale, audience, path, ...vars } = props;
	return sendSms({
		to,
		locale,
		kind: audience,
		vars: { ...vars, url: appUrl(path) },
	});
}
