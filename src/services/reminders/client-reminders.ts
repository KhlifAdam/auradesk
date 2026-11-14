import "server-only";

import type { Locale } from "@/i18n/config";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { mailCopy, resolveMailLocale } from "@/lib/mail/mail-copy";
import { sendMail } from "@/lib/mail/send-mail";
import {
	type NoticeCopy,
	noticeEmail,
} from "@/lib/mail/templates/notice-email";
import { addDays, todayKey } from "@/services/calendar/dates";
import { computeTotals, roundMoney } from "@/services/invoices/totals";
import { addMonths } from "@/services/privacy/purge";
import { formatMoney } from "@/services/projects/money";
import { DELIVERED_STAGES } from "@/services/projects/stages";

// Sent once a day by the scheduler. Each reminder matches exactly one day
// (the shoot is tomorrow, the invoice was due a week ago...), so a daily run
// sends each one once without having to remember what went out.

const TIME_ZONE = "Africa/Tunis";
const DUE_SOON_DAYS = 3;
const OVERDUE_DAYS = [1, 7];
const GALLERY_NOTICE_DAYS = 14;

const appUrl = (path: string) =>
	`${env.BETTER_AUTH_URL.replace(/\/$/, "")}${path}`;

/** Dates are stored at midnight UTC: the instants of one calendar day. */
const onDay = (key: string) => ({
	gte: new Date(`${key}T00:00:00.000Z`),
	lt: new Date(`${addDays(key, 1)}T00:00:00.000Z`),
});

/** dd/mm/yyyy reads the same in both languages of the email. */
const shortDate = (date: Date) =>
	date.toLocaleDateString("en-GB", { timeZone: "UTC" });

const studioName = (photographer: {
	name: string;
	studio: { name: string } | null;
}) => photographer.studio?.name ?? photographer.name;

const PHOTOGRAPHER = {
	select: { name: true, studio: { select: { name: true } } },
} as const;
const CLIENT = { select: { email: true, locale: true } } as const;

interface Reminder {
	to: string;
	locale: Locale;
	copy: (locale: Locale) => NoticeCopy;
	vars: Record<string, string>;
	path: string;
}

/** To the client of each project shot tomorrow. */
async function shootReminders(today: string): Promise<Reminder[]> {
	const projects = await db.project.findMany({
		where: {
			eventDate: onDay(addDays(today, 1)),
			inviteStatus: "ACCEPTED",
			client: { isNot: null },
			stage: { notIn: [...DELIVERED_STAGES] },
		},
		select: {
			id: true,
			title: true,
			client: CLIENT,
			photographer: PHOTOGRAPHER,
		},
	});
	return projects.flatMap(({ client, ...project }) =>
		client
			? [
					{
						to: client.email,
						locale: resolveMailLocale(client.locale),
						copy: (l: Locale) => mailCopy(l).shootReminder,
						vars: {
							studio: studioName(project.photographer),
							project: project.title,
						},
						path: `/portal/projects/${project.id}`,
					},
				]
			: [],
	);
}

/** Unpaid invoices due in a few days, or a day and a week past due. */
async function invoiceReminders(today: string): Promise<Reminder[]> {
	const days = [DUE_SOON_DAYS, ...OVERDUE_DAYS.map((d) => -d)];
	const invoices = await db.invoice.findMany({
		where: {
			status: "SENT",
			client: { isNot: null },
			OR: days.map((d) => ({ dueDate: onDay(addDays(today, d)) })),
		},
		select: {
			id: true,
			number: true,
			dueDate: true,
			discount: true,
			taxRate: true,
			items: { select: { quantity: true, unitPrice: true } },
			payments: { select: { amount: true } },
			client: CLIENT,
			photographer: PHOTOGRAPHER,
		},
	});
	return invoices.flatMap((invoice) => {
		const { client, dueDate } = invoice;
		if (!client || !dueDate) return [];
		const { total } = computeTotals(
			invoice.items.map((item) => ({
				quantity: item.quantity.toNumber(),
				unitPrice: item.unitPrice.toNumber(),
			})),
			invoice.discount.toNumber(),
			invoice.taxRate.toNumber(),
		);
		const paid = invoice.payments.reduce((s, p) => s + p.amount.toNumber(), 0);
		const owed = roundMoney(total - paid);
		if (owed <= 0) return [];
		const locale = resolveMailLocale(client.locale);
		const overdue = dueDate < onDay(today).gte;
		return [
			{
				to: client.email,
				locale,
				copy: (l: Locale) =>
					overdue ? mailCopy(l).invoiceOverdue : mailCopy(l).invoiceDueSoon,
				vars: {
					studio: studioName(invoice.photographer),
					number: invoice.number,
					amount: formatMoney(owed, locale),
					date: shortDate(dueDate),
				},
				path: `/portal/invoices/${invoice.id}`,
			},
		];
	});
}

/** Delivered projects whose galleries the studio deletes two weeks from now. */
async function galleryReminders(today: string): Promise<Reminder[]> {
	const deletedOn = addDays(today, GALLERY_NOTICE_DAYS);
	const studios = await db.studio.findMany({
		where: { galleryRetentionMonths: { not: null } },
		select: { photographerId: true, galleryRetentionMonths: true },
	});
	if (studios.length === 0) return [];
	const deletion = new Date(`${deletedOn}T00:00:00.000Z`);
	const projects = await db.project.findMany({
		where: {
			inviteStatus: "ACCEPTED",
			client: { isNot: null },
			galleries: { some: { kind: "FINAL" } },
			OR: studios.map((studio) => {
				const key = addMonths(deletion, -(studio.galleryRetentionMonths ?? 0))
					.toISOString()
					.slice(0, 10);
				return {
					photographerId: studio.photographerId,
					deliveredAt: onDay(key),
				};
			}),
		},
		select: {
			id: true,
			title: true,
			client: CLIENT,
			photographer: PHOTOGRAPHER,
		},
	});
	return projects.flatMap(({ client, ...project }) =>
		client
			? [
					{
						to: client.email,
						locale: resolveMailLocale(client.locale),
						copy: (l: Locale) => mailCopy(l).galleryExpiring,
						vars: {
							studio: studioName(project.photographer),
							project: project.title,
							date: shortDate(deletion),
						},
						path: `/portal/projects/${project.id}`,
					},
				]
			: [],
	);
}

/** Sends today's reminders; one failed email never stops the others. */
export async function sendClientReminders() {
	const today = todayKey(TIME_ZONE);
	const groups = await Promise.all([
		shootReminders(today),
		invoiceReminders(today),
		galleryReminders(today),
	]);
	const reminders = groups.flat();
	const results = await Promise.allSettled(
		reminders.map(({ to, locale, copy, vars, path }) =>
			sendMail({
				to,
				...noticeEmail(copy(locale), locale, vars, appUrl(path)),
			}),
		),
	);
	const failed = results.filter((r) => r.status === "rejected");
	for (const failure of failed)
		console.error("[reminders] email failed", failure.reason);
	return { sent: reminders.length - failed.length, failed: failed.length };
}
