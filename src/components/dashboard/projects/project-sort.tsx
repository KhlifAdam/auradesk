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
import { PROJECT_SORTS, type ProjectSort } from "@/services/projects/schemas";

interface ProjectSortProps {
	sort?: ProjectSort;
	order?: "asc" | "desc";
}

/** Sort field and direction, kept in `?sort=&order=`. */
export function ProjectSortControl({
	sort = "eventDate",
	order,
}: ProjectSortProps) {
	const t = useTranslations("Projects.list.sort");
	const update = useUpdateSearchParams();
	// Same defaults as the query: titles A → Z, dates newest first.
	const direction = order ?? (sort === "title" ? "asc" : "desc");
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
					{PROJECT_SORTS.map((value) => (
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
				{t(
					sort === "title"
						? ascending
							? "az"
							: "za"
						: ascending
							? "oldest"
							: "newest",
				)}
			</Button>
		</div>
	);
}
