import { CalendarClock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { EquipmentSummary } from "@/services/equipment/types";
import { AvailabilityBadge } from "./availability-badge";
import { CategoryIcon } from "./category-icon";

/** Inventory rows: what it is, where it is today and when it's next busy. */
export async function EquipmentList({ items }: { items: EquipmentSummary[] }) {
	const t = await getTranslations("Equipment.list");
	const tCategory = await getTranslations("Equipment.categories");
	const tKind = await getTranslations("Equipment.kinds");
	const format = await getFormatter();
	const range = (start: string, end: string) =>
		format.dateTimeRange(new Date(start), new Date(end), {
			dateStyle: "medium",
			timeZone: "UTC",
		});

	return (
		<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
			{items.map((item) => (
				<li key={item.id}>
					<Link
						href={`/dashboard/equipment/${item.id}`}
						className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 transition-colors duration-200 hover:bg-muted/50"
					>
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
							<CategoryIcon category={item.category} />
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium">{item.name}</p>
							<p className="truncate text-xs text-muted-foreground">
								{[tCategory(item.category), item.brand, item.model]
									.filter(Boolean)
									.join(" · ")}
								{item.ownership === "HIRED" && ` · ${t("hired")}`}
							</p>
						</div>
						<div className="flex items-center gap-3 text-xs text-muted-foreground">
							{item.nextBooking && (
								<span className="hidden items-center gap-1 md:flex">
									<CalendarClock className="h-3 w-3" />
									{tKind(item.nextBooking.kind)} ·{" "}
									{range(item.nextBooking.startDate, item.nextBooking.endDate)}
								</span>
							)}
							<AvailabilityBadge availability={item.availability} />
							<ChevronRight className="hidden h-3.5 w-3.5 sm:block" />
						</div>
					</Link>
				</li>
			))}
		</ul>
	);
}
