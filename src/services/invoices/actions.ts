"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { toE164 } from "@/lib/phone";
import { sharesProjectWith } from "@/services/clients/queries";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { lockPhotographer } from "@/services/shared/lock-rows";
import { emptyToNull, idSchema } from "@/services/shared/schemas";
import { nextInvoiceNumber, syncProjectPayment } from "./ledger";
import {
	type InvoiceValues,
	invoiceSchema,
	updateInvoiceSchema,
} from "./schemas";

const toDate = (value: string) => (value ? new Date(value) : null);

/**
 * The project and client account the invoice points to: only the
 * photographer's own project, and a client who shares a project with them.
 */
async function resolveLinks(photographerId: string, values: InvoiceValues) {
	const project = values.projectId
		? await db.project.findFirst({
				where: { id: values.projectId, photographerId },
				select: { id: true, clientId: true },
			})
		: null;
	if (values.projectId && !project) return null;

	// The email is what the form shows, so it wins over a stale picked id.
	const identity = values.clientEmail
		? { email: { equals: values.clientEmail, mode: "insensitive" as const } }
		: values.clientId
			? { id: values.clientId }
			: null;
	const client = identity
		? await db.user.findFirst({
				where: { ...sharesProjectWith(photographerId), ...identity },
				select: { id: true },
			})
		: null;
	return {
		projectId: project?.id ?? null,
		clientId: client?.id ?? project?.clientId ?? null,
	};
}

function toData(values: InvoiceValues) {
	return {
		clientName: values.clientName,
		clientEmail: emptyToNull(values.clientEmail.toLowerCase()),
		clientPhone: emptyToNull(toE164(values.clientPhone) ?? values.clientPhone),
		clientAddress: emptyToNull(values.clientAddress),
		issueDate: new Date(values.issueDate),
		dueDate: toDate(values.dueDate),
		taxRate: values.taxRate ?? 0,
		discount: values.discount ?? 0,
		notes: emptyToNull(values.notes),
	};
}

const toItems = (values: InvoiceValues) =>
	values.items.map((item, position) => ({
		description: item.description,
		quantity: item.quantity ?? 1,
		unitPrice: item.unitPrice ?? 0,
		position,
	}));

export async function createInvoice(
	input: unknown,
): Promise<ActionResult<{ id: string }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = invoiceSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const links = await resolveLinks(photographerId, parsed.data);
	if (!links) return fail("notFound");

	const invoice = await db.$transaction(async (tx) => {
		// Serializes numbering, so two invoices never get the same number.
		await lockPhotographer(tx, photographerId);
		const year = new Date(parsed.data.issueDate).getUTCFullYear();
		return tx.invoice.create({
			data: {
				photographerId,
				...links,
				number: await nextInvoiceNumber(tx, photographerId, year),
				...toData(parsed.data),
				items: { create: toItems(parsed.data) },
			},
			select: { id: true },
		});
	});

	revalidateClientWork();
	return ok(invoice);
}

/** Drafts and sent invoices can change; paid and cancelled ones are final. */
export async function updateInvoice(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = updateInvoiceSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { id, ...values } = parsed.data;
	const links = await resolveLinks(photographerId, values);
	if (!links) return fail("notFound");

	const error = await db.$transaction(async (tx) => {
		const current = await tx.invoice.findFirst({
			where: { id, photographerId },
			select: { status: true, projectId: true },
		});
		if (!current) return "notFound";
		if (current.status === "PAID" || current.status === "CANCELLED")
			return "invoiceLocked";

		await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
		await tx.invoice.update({
			where: { id },
			data: {
				...links,
				...toData(values),
				items: { create: toItems(values) },
			},
		});
		await syncProjectPayment(tx, current.projectId);
		if (links.projectId !== current.projectId)
			await syncProjectPayment(tx, links.projectId);
		return null;
	});
	if (error) return fail(error);

	revalidateClientWork();
	return ok();
}

/** Only drafts are deleted; an issued invoice is cancelled instead. */
export async function deleteInvoice(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.invoice.deleteMany({
		where: { id: parsed.data, photographerId, status: "DRAFT" },
	});
	if (count === 0) return fail("invoiceNotDraft");

	revalidateClientWork();
	return ok();
}
