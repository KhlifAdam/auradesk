"use server";

import type { Prisma } from "@/generated/prisma/client";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { toE164 } from "@/lib/phone";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { lockPhotographer } from "@/services/shared/lock-rows";
import { emptyToNull, idSchema } from "@/services/shared/schemas";
import { type QuoteValues, quoteSchema, updateQuoteSchema } from "./schemas";

const toDate = (value: string) => (value ? new Date(value) : null);

/** Next number for the year: DEV-2026-0001… Lock the photographer first. */
async function nextQuoteNumber(
	tx: Prisma.TransactionClient,
	photographerId: string,
	year: number,
) {
	const prefix = `DEV-${year}-`;
	const last = await tx.quote.findFirst({
		where: { photographerId, number: { startsWith: prefix } },
		orderBy: { number: "desc" },
		select: { number: true },
	});
	const next = last ? Number(last.number.slice(prefix.length)) + 1 : 1;
	return `${prefix}${String(next).padStart(4, "0")}`;
}

/**
 * The booking, project and client account the quote points to: only the
 * photographer's own, and a client who has a booking or project with them.
 */
async function resolveLinks(photographerId: string, values: QuoteValues) {
	const [booking, project] = await Promise.all([
		values.bookingId
			? db.booking.findFirst({
					where: { id: values.bookingId, photographerId },
					select: { id: true, clientId: true, projectId: true },
				})
			: null,
		values.projectId
			? db.project.findFirst({
					where: { id: values.projectId, photographerId },
					select: { id: true, clientId: true },
				})
			: null,
	]);
	if ((values.bookingId && !booking) || (values.projectId && !project))
		return null;

	// The email is what the form shows, so it wins over a stale picked id.
	const identity = values.clientEmail
		? { email: { equals: values.clientEmail, mode: "insensitive" as const } }
		: values.clientId
			? { id: values.clientId }
			: null;
	const client = identity
		? await db.user.findFirst({
				where: {
					...identity,
					OR: [
						{ clientProjects: { some: { photographerId } } },
						{ clientBookings: { some: { photographerId } } },
					],
				},
				select: { id: true },
			})
		: null;
	return {
		bookingId: booking?.id ?? null,
		projectId: project?.id ?? booking?.projectId ?? null,
		clientId: client?.id ?? project?.clientId ?? booking?.clientId ?? null,
	};
}

function toData(values: QuoteValues) {
	return {
		clientName: values.clientName,
		clientEmail: emptyToNull(values.clientEmail.toLowerCase()),
		clientPhone: emptyToNull(toE164(values.clientPhone) ?? values.clientPhone),
		clientAddress: emptyToNull(values.clientAddress),
		issueDate: new Date(values.issueDate),
		validUntil: toDate(values.dueDate),
		taxRate: values.taxRate ?? 0,
		discount: values.discount ?? 0,
		notes: emptyToNull(values.notes),
	};
}

const toItems = (values: QuoteValues) =>
	values.items.map((item, position) => ({
		description: item.description,
		quantity: item.quantity ?? 1,
		unitPrice: item.unitPrice ?? 0,
		position,
	}));

export async function createQuote(
	input: unknown,
): Promise<ActionResult<{ id: string }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = quoteSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const links = await resolveLinks(photographerId, parsed.data);
	if (!links) return fail("notFound");

	const quote = await db.$transaction(async (tx) => {
		// Serializes numbering, so two quotes never get the same number.
		await lockPhotographer(tx, photographerId);
		const year = new Date(parsed.data.issueDate).getUTCFullYear();
		return tx.quote.create({
			data: {
				photographerId,
				...links,
				number: await nextQuoteNumber(tx, photographerId, year),
				...toData(parsed.data),
				items: { create: toItems(parsed.data) },
			},
			select: { id: true },
		});
	});

	revalidateClientWork();
	return ok(quote);
}

/** Drafts and sent quotes can change; once answered or invoiced they are final. */
export async function updateQuote(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = updateQuoteSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { id, ...values } = parsed.data;
	const links = await resolveLinks(photographerId, values);
	if (!links) return fail("notFound");

	const error = await db.$transaction(async (tx) => {
		const current = await tx.quote.findFirst({
			where: { id, photographerId },
			select: { status: true, invoiceId: true },
		});
		if (!current) return "notFound";
		if (current.invoiceId || !["DRAFT", "SENT"].includes(current.status))
			return "quoteLocked";

		await tx.quoteItem.deleteMany({ where: { quoteId: id } });
		await tx.quote.update({
			where: { id },
			data: { ...links, ...toData(values), items: { create: toItems(values) } },
		});
		return null;
	});
	if (error) return fail(error);

	revalidateClientWork();
	return ok();
}

/** Only drafts are deleted. */
export async function deleteQuote(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.quote.deleteMany({
		where: { id: parsed.data, photographerId, status: "DRAFT" },
	});
	if (count === 0) return fail("quoteNotDraft");

	revalidateClientWork();
	return ok();
}
