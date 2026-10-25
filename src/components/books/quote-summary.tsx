"use client";

import { useLocale, useTranslations } from "next-intl";
import type { BookFormat } from "@/lib/books/formats";
import type { Quote } from "@/lib/books/pricing";
import { formatMoney } from "@/services/projects/money";

interface QuoteSummaryProps {
	quote: Quote;
	format: BookFormat;
	pages: number;
	/** What the studio finally charges, when it differs from the calculation. */
	charged?: number | null;
}

/** The price of a book line by line, then per copy and in total. */
export function QuoteSummary({
	quote,
	format,
	pages,
	charged,
}: QuoteSummaryProps) {
	const t = useTranslations("PhotoBook.quote");
	const tFormat = useTranslations("PhotoBook.editor.settings.formats");
	const locale = useLocale();
	const money = (value: number) => formatMoney(value, locale);
	const label = (line: Quote["lines"][number]) => {
		switch (line.kind) {
			case "base":
				return t("base", { format: tFormat(format), pages });
			case "pages":
				return t("pages", { count: line.count ?? 0 });
			case "cover":
				return t("cover", { name: line.name ?? "" });
			case "paper":
				return t("paper", { name: line.name ?? "" });
			default:
				return line.name ?? "";
		}
	};
	const total = charged ?? quote.total;

	return (
		<dl className="flex flex-col gap-1 text-sm">
			{quote.lines.map((line, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: lines are positional.
				<div key={i} className="flex justify-between gap-3">
					<dt className="text-muted-foreground">{label(line)}</dt>
					<dd className="tabular-nums">{money(line.amount)}</dd>
				</div>
			))}
			<div className="mt-1 flex justify-between gap-3 border-t border-border pt-1.5">
				<dt className="text-muted-foreground">{t("perCopy")}</dt>
				<dd className="tabular-nums">{money(quote.perCopy)}</dd>
			</div>
			{quote.copies > 1 && (
				<div className="flex justify-between gap-3">
					<dt className="text-muted-foreground">
						{t("copies", { count: quote.copies })}
					</dt>
					<dd className="tabular-nums">× {quote.copies}</dd>
				</div>
			)}
			<div className="flex justify-between gap-3 text-base font-semibold">
				<dt>{t("total")}</dt>
				<dd className="tabular-nums">{money(total)}</dd>
			</div>
			{charged != null && Math.abs(charged - quote.total) > 0.0005 && (
				<p className="text-[11px] text-muted-foreground">
					{t("adjusted", { quoted: money(quote.total) })}
				</p>
			)}
		</dl>
	);
}
