import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { EquipmentDetail } from "@/services/equipment/types";
import { formatMoney } from "@/services/projects/money";

/** Read-only sheet of the item: identity, ownership and money. */
export async function EquipmentFacts({ item }: { item: EquipmentDetail }) {
	const t = await getTranslations("Equipment.facts");
	const tCategory = await getTranslations("Equipment.categories");
	const tOwnership = await getTranslations("Equipment.ownerships");
	const format = await getFormatter();
	const locale = await getLocale();
	const money = (value: number | null) =>
		value === null ? null : formatMoney(value, locale);

	const facts: [string, string | null][] = [
		[t("category"), tCategory(item.category)],
		[t("brandModel"), [item.brand, item.model].filter(Boolean).join(" ")],
		[t("serialNumber"), item.serialNumber],
		[t("ownership"), tOwnership(item.ownership)],
		[
			t("purchaseDate"),
			item.purchaseDate &&
				format.dateTime(new Date(item.purchaseDate), {
					dateStyle: "medium",
					timeZone: "UTC",
				}),
		],
		[t("purchasePrice"), money(item.purchasePrice)],
		[t("dailyRate"), money(item.dailyRate)],
		[t("rentalIncome"), money(item.rentalIncome)],
	];

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
			<dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
				{facts.map(([label, value]) => (
					<div key={label} className="flex flex-col gap-0.5">
						<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
							{label}
						</dt>
						<dd className="truncate text-sm">
							{value || <span className="text-muted-foreground/70">—</span>}
						</dd>
					</div>
				))}
			</dl>
			{item.notes && (
				<p className="whitespace-pre-wrap border-t border-border pt-2 text-xs text-muted-foreground">
					{item.notes}
				</p>
			)}
		</section>
	);
}
