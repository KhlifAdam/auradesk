"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useUpdateSearchParams } from "@/hooks/use-update-search-params";
import { BOOKING_SORTS, type BookingSort } from "@/services/bookings/schemas";

interface BookingSortProps {
	sort?: BookingSort;
	order?: "asc" | "desc";
}

/** Sort field and direction, kept in `?sort=&order=`. */
export function BookingSortControl({
	sort = "created",
	order,
}: BookingSortProps) {
	const t = useTranslations("Bookings.list.sort");
	const update = useUpdateSearchParams();
	// Same defaults as the query: newest request first, soonest event first.
	const direction = order ?? (sort === "created" ? "desc" : "asc");
	const ascending = direction === "asc";

	return (
		<div className="flex items-center gap-1.5">
			<Select
				value={sort}
				onValueChange={(value) => update({ sort: value, order: null })}
			>
				<SelectTrigger className="h-8 w-44 text-xs" aria-label={t("label")}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{BOOKING_SORTS.map((value) => (
						<SelectItem key={value} value={value} className="text-xs">
							{t(`fields.${value}`)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Button
				variant="outline"
				size="sm"
				className="h-8 gap-1.5 text-xs"
				onClick={() => update({ order: ascending ? "desc" : "asc" })}
				title={t("toggle")}
			>
				{ascending ? (
					<ArrowUpNarrowWide className="h-3.5 w-3.5" />
				) : (
					<ArrowDownWideNarrow className="h-3.5 w-3.5" />
				)}
				{t(ascending ? "oldest" : "newest")}
			</Button>
		</div>
	);
}
