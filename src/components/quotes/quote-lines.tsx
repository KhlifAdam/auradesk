import { getLocale } from "next-intl/server";
import type { BookingQuote } from "@/services/bookings/booking-quote";
import { formatMoney } from "@/services/projects/money";

/** A quote's lines and total, as both the studio and the client read it. */
export async function QuoteLines({
	quote,
	totalLabel,
}: {
	quote: Pick<BookingQuote, "lines" | "total">;
	totalLabel: string;
}) {
	const locale = await getLocale();
	const money = (value: number) => formatMoney(value, locale);

	return (
		<div className="flex flex-col gap-1.5 text-sm">
			{quote.lines.map((line, i) => (
				<div
					// Lines have no id of their own; their order is stable.
					// biome-ignore lint/suspicious/noArrayIndexKey: ordered lines
					key={i}
					className="flex items-baseline justify-between gap-3"
				>
					<span className="min-w-0 text-muted-foreground">
						{line.description}
						{line.quantity !== 1 && ` × ${line.quantity}`}
					</span>
					<span className="shrink-0 tabular-nums">
						{money(line.quantity * line.unitPrice)}
					</span>
				</div>
			))}
			<div className="mt-1 flex items-baseline justify-between gap-3 border-t border-border pt-2 font-semibold">
				<span>{totalLabel}</span>
				<span className="tabular-nums text-primary">{money(quote.total)}</span>
			</div>
		</div>
	);
}
