import "server-only";

import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { invoiceGross, projectRemainder } from "@/lib/money/collect";
import { realEmail } from "@/lib/phone";
import type { InvoiceValues } from "./schemas";

/**
 * What a new invoice for a project should bill, so nothing is typed twice
 * or billed twice:
 * - `quote`: its accepted quote isn't invoiced yet, its lines come in;
 * - `full`: nothing invoiced yet, one line at the price (tax included);
 * - `balance`: partly invoiced, one line for the rest;
 * - `invoiced`: everything is billed already, the lines start empty.
 */
export type ProjectInvoiceKind = "quote" | "full" | "balance" | "invoiced";

export interface ProjectInvoiceDraft {
	projectId: string;
	projectTitle: string;
	kind: ProjectInvoiceKind;
	/** The quote the lines come from (kind `quote`). */
	quote: { id: string; number: string } | null;
	values: Partial<InvoiceValues>;
}

const num = (value: { toNumber(): number }) => value.toNumber();

export async function projectInvoiceDraft(
	photographerId: string,
	projectId: string,
): Promise<ProjectInvoiceDraft | null> {
	const project = await db.project.findFirst({
		where: { id: projectId, photographerId },
		select: {
			id: true,
			title: true,
			serviceType: true,
			price: true,
			advance: true,
			clientPhone: true,
			inviteEmail: true,
			client: { select: { id: true, name: true, email: true } },
			booking: {
				select: { clientName: true, clientEmail: true, clientPhone: true },
			},
			invoices: {
				where: { status: { in: ["SENT", "PAID"] } },
				select: {
					taxRate: true,
					items: { select: { quantity: true, unitPrice: true } },
				},
			},
			quotes: {
				where: { status: "ACCEPTED", invoiceId: null },
				orderBy: [{ createdAt: "desc" }, { id: "desc" }],
				take: 1,
				select: {
					id: true,
					number: true,
					taxRate: true,
					discount: true,
					items: {
						orderBy: [{ position: "asc" }, { id: "asc" }],
						select: { description: true, quantity: true, unitPrice: true },
					},
				},
			},
		},
	});
	if (!project) return null;

	const { client, booking } = project;
	const who: Partial<InvoiceValues> = {
		projectId: project.id,
		clientId: client?.id ?? "",
		clientName: client?.name ?? booking?.clientName ?? "",
		clientEmail:
			(client && realEmail(client.email)) ||
			booking?.clientEmail ||
			project.inviteEmail ||
			"",
		clientPhone: project.clientPhone ?? booking?.clientPhone ?? "",
	};
	const base = { projectId: project.id, projectTitle: project.title };

	const [quote] = project.quotes;
	if (quote)
		return {
			...base,
			kind: "quote",
			quote: { id: quote.id, number: quote.number },
			values: {
				...who,
				taxRate: num(quote.taxRate) || null,
				discount: num(quote.discount) || null,
				items: quote.items.map((item) => ({
					description: item.description,
					quantity: num(item.quantity),
					unitPrice: num(item.unitPrice),
				})),
			},
		};

	const hasIssuedInvoices = project.invoices.length > 0;
	const price = project.price ? num(project.price) : null;
	const left =
		price === null
			? null
			: hasIssuedInvoices
				? projectRemainder({
						price,
						advance: num(project.advance),
						invoicedGross: project.invoices.reduce(
							(sum, invoice) =>
								sum +
								invoiceGross(
									invoice.items.reduce(
										(lines, item) =>
											lines + num(item.quantity) * num(item.unitPrice),
										0,
									),
									num(invoice.taxRate),
								),
							0,
						),
						hasIssuedInvoices,
					})
				: // A first invoice bills the whole price; an advance already
					// received becomes its first payment when it is sent.
					price;

	const t = await getTranslations("Invoices.draft");
	const tService = await getTranslations("Projects.serviceTypes");
	if (left !== null && left <= 0)
		return {
			...base,
			kind: "invoiced",
			quote: null,
			values: {
				...who,
				items: [{ description: "", quantity: 1, unitPrice: null }],
			},
		};
	return {
		...base,
		kind: hasIssuedInvoices ? "balance" : "full",
		quote: null,
		values: {
			...who,
			// The project price already includes tax.
			taxRate: null,
			items: [
				{
					description: hasIssuedInvoices
						? t("balanceLine", { title: project.title })
						: `${tService(project.serviceType)} · ${project.title}`,
					quantity: 1,
					unitPrice: left,
				},
			],
		},
	};
}
