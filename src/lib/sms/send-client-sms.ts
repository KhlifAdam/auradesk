import "server-only";

import { env } from "@/lib/env";
import { sendSms } from "./send-sms";
import { smsText } from "./sms-copy";

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
		body: smsText(locale, "otp", {
			code,
			minutes: String(expiresInMinutes),
		}),
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
		body: smsText(locale, "projectInvitation", {
			studio,
			project,
			url: appUrl(`/client/phone?phone=${encodeURIComponent(to)}`),
		}),
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
		body: smsText(locale, "galleryShared", {
			...vars,
			url: appUrl(`/portal/galleries/${galleryId}`),
		}),
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
		body: smsText(locale, "newMessage", { sender, url: appUrl(path) }),
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
		body: smsText(locale, "bookingSent", { ...vars, url: appUrl(path) }),
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
		body: smsText(locale, "projectCreated", { ...vars, url: appUrl(path) }),
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
		body: smsText(locale, kind, {
			...vars,
			url: appUrl(`/portal/projects/${projectId}`),
		}),
	});
}
