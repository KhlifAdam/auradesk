import "server-only";

import { getTranslations } from "next-intl/server";
import type { Prisma } from "@/generated/prisma/client";
import type { Quote } from "@/lib/books/pricing";
import { nextInvoiceNumber } from "@/services/invoices/ledger";
import { lockPhotographer } from "@/services/shared/lock-rows";

const DUE_DAYS = 14;
const DAY_MS = 86_400_000;

interface BookInvoiceInput {
	photographerId: string;
	client: {
		id: string;
		name: string;
		email: string | null;
		phone: string | null;
	};
	title: string;
	pages: number;
	format: string;
	quote: Quote;
	/** What the studio charges, which may differ from the quote. */
	total: number;
}

/**
 * Bills an accepted photo book order: one line per part of the price, times
 * the copies. A higher price than quoted is a line of its own; a lower one a
 * discount. Not tied to the project, so it never disturbs the project's own
 * payment (which keeps the client's photos unlocked). Sent at once.
 */
export async function createBookInvoice(
	tx: Prisma.TransactionClient,
	input: BookInvoiceInput,
) {
	const t = await getTranslations("PhotoBook.invoice");
	const { quote, total } = input;
	await lockPhotographer(tx, input.photographerId);
	const today = new Date(new Date().toISOString().slice(0, 10));

	const describe = (line: Quote["lines"][number]) => {
		switch (line.kind) {
			case "base":
				return t("base", {
					title: input.title,
					format: input.format,
					pages: input.pages,
				});
			case "pages":
				return t("pages", { count: line.count ?? 0 });
			case "cover":
				return t("cover", { name: line.name ?? "" });
			case "paper":
				return t("paper", { name: line.name ?? "" });
			default:
				return line.name ?? t("extra");
		}
	};
	const items = quote.lines.map((line) => ({
		description: describe(line),
		quantity: quote.copies,
		unitPrice: line.amount,
	}));
	const difference = Math.round((total - quote.total) * 1000) / 1000;
	if (difference > 0)
		items.push({
			description: t("adjustment"),
			quantity: 1,
			unitPrice: difference,
		});

	return tx.invoice.create({
		data: {
			photographerId: input.photographerId,
			clientId: input.client.id,
			number: await nextInvoiceNumber(
				tx,
				input.photographerId,
				today.getUTCFullYear(),
			),
			status: "SENT",
			sentAt: new Date(),
			clientName: input.client.name,
			clientEmail: input.client.email,
			clientPhone: input.client.phone,
			issueDate: today,
			dueDate: new Date(today.getTime() + DUE_DAYS * DAY_MS),
			taxRate: 0,
			discount: difference < 0 ? -difference : 0,
			notes: t("note", { title: input.title }),
			items: {
				create: items.map((item, position) => ({ ...item, position })),
			},
		},
		select: { id: true, number: true },
	});
}
