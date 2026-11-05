import type { Locale } from "@/i18n/config";
import { env } from "@/lib/env";
import { mailCopy } from "./mail-copy";
import { sendMail } from "./send-mail";
import { noticeEmail } from "./templates/notice-email";

const appUrl = (path: string) =>
	`${env.BETTER_AUTH_URL.replace(/\/$/, "")}${path}`;

/** dd/mm/yyyy reads the same in both languages of the email. */
function shortDate(date: Date) {
	return date.toLocaleDateString("en-GB", { timeZone: "UTC" });
}

/** To the invited client; new addresses are sent to the client sign-up. */
export async function sendProjectInvitationEmail(props: {
	to: string;
	locale: Locale;
	studio: string;
	project: string;
	eventDate: Date | null;
	hasAccount: boolean;
}) {
	const { to, locale, studio, project, eventDate, hasAccount } = props;
	const label = eventDate ? `${project} (${shortDate(eventDate)})` : project;
	const url = appUrl(
		hasAccount ? "/portal" : `/client/register?email=${encodeURIComponent(to)}`,
	);
	await sendMail({
		to,
		...noticeEmail(
			mailCopy(locale).projectInvitation,
			locale,
			{ studio, project: label },
			url,
		),
	});
}

/** To the client, when a gallery becomes visible to them. */
export async function sendGallerySharedEmail(props: {
	to: string;
	locale: Locale;
	studio: string;
	gallery: string;
	project: string;
	galleryId: string;
}) {
	const { to, locale, galleryId, ...vars } = props;
	const url = appUrl(`/portal/galleries/${galleryId}`);
	await sendMail({
		to,
		...noticeEmail(mailCopy(locale).galleryShared, locale, vars, url),
	});
}

/** To the photographer, when the client submits their picks. */
export async function sendSelectionSubmittedEmail(props: {
	to: string;
	locale: Locale;
	client: string;
	gallery: string;
	project: string;
	count: number;
	projectId: string;
	galleryId: string;
}) {
	const { to, locale, projectId, galleryId, count, ...vars } = props;
	const url = appUrl(
		`/dashboard/projects/${projectId}/galleries/${galleryId}?filter=selected`,
	);
	await sendMail({
		to,
		...noticeEmail(
			mailCopy(locale).selectionSubmitted,
			locale,
			{ ...vars, count: String(count) },
			url,
		),
	});
}

/** To whoever has an unread message waiting, in their own language. */
export async function sendNewMessageEmail(props: {
	to: string;
	locale: Locale;
	sender: string;
	preview: string;
	path: string;
}) {
	const { to, locale, path, ...vars } = props;
	await sendMail({
		to,
		...noticeEmail(mailCopy(locale).newMessage, locale, vars, appUrl(path)),
	});
}

/** To the photographer, when a visitor asks for a service on their site. */
export async function sendBookingRequestEmail(props: {
	to: string;
	locale: Locale;
	client: string;
	preview: string;
	bookingId: string;
}) {
	const { to, locale, bookingId, ...vars } = props;
	await sendMail({
		to,
		...noticeEmail(
			mailCopy(locale).bookingRequest,
			locale,
			vars,
			appUrl(`/dashboard/bookings/${bookingId}`),
		),
	});
}

/** To the client, when the photographer sends them a booking request. */
export async function sendBookingSentEmail(props: {
	to: string;
	locale: Locale;
	studio: string;
	booking: string;
	/** Where to go: the request itself, or sign-up for someone with no account. */
	path: string;
}) {
	const { to, locale, path, ...vars } = props;
	await sendMail({
		to,
		...noticeEmail(mailCopy(locale).bookingSent, locale, vars, appUrl(path)),
	});
}

export type BookingReplyKind = "updated" | "accepted" | "declined";

/** To the photographer, when the client edits, accepts or declines a request. */
export async function sendBookingClientReplyEmail(props: {
	to: string;
	locale: Locale;
	client: string;
	booking: string;
	kind: BookingReplyKind;
	bookingId: string;
}) {
	const { to, locale, kind, bookingId, ...vars } = props;
	const { actions, ...copy } = mailCopy(locale).bookingClientReply;
	await sendMail({
		to,
		...noticeEmail(
			copy,
			locale,
			{ ...vars, action: actions[kind] },
			appUrl(`/dashboard/bookings/${bookingId}`),
		),
	});
}

export type ProjectStageNotice = "galleriesReady" | "projectDelivered";

/** To the client, when their galleries open for choosing or are delivered. */
export async function sendProjectStageEmail(props: {
	to: string;
	locale: Locale;
	kind: ProjectStageNotice;
	studio: string;
	project: string;
	projectId: string;
}) {
	const { to, locale, kind, projectId, ...vars } = props;
	await sendMail({
		to,
		...noticeEmail(
			mailCopy(locale)[kind],
			locale,
			vars,
			appUrl(`/portal/projects/${projectId}`),
		),
	});
}

/** To the client, when their accepted booking is confirmed and the project is ready. */
export async function sendProjectCreatedEmail(props: {
	to: string;
	locale: Locale;
	studio: string;
	project: string;
	path: string;
}) {
	const { to, locale, path, ...vars } = props;
	await sendMail({
		to,
		...noticeEmail(mailCopy(locale).projectCreated, locale, vars, appUrl(path)),
	});
}

export type ChangeAudience = "changeForClient" | "changeForStudio";

/** Something changed on a booking or project: the other side is told once. */
export async function sendChangeEmail(props: {
	to: string;
	locale: Locale;
	audience: ChangeAudience;
	/** Who made the change: the studio's name, or the client's. */
	who: string;
	item: string;
	path: string;
}) {
	const { to, locale, audience, path, ...vars } = props;
	await sendMail({
		to,
		...noticeEmail(mailCopy(locale)[audience], locale, vars, appUrl(path)),
	});
}
