"use client";

import { Briefcase, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { CARD_GRID } from "@/components/dashboard/shared/card-grid";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { SortableGrid } from "@/components/dashboard/shared/sortable-grid";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { Button } from "@/components/ui/button";
import { useOptimisticOrder } from "@/hooks/use-optimistic-order";
import { reorderPackages } from "@/services/packages/actions";
import type { PackagePage } from "@/services/packages/types";
import { PackageCard } from "./package-card";
import { PackageFormSheet } from "./package-form-sheet";

export function NewPackageButton() {
	const t = useTranslations("Services");
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button size="sm" className="h-8 gap-1.5" onClick={() => setOpen(true)}>
				<Plus className="h-3.5 w-3.5" />
				{t("newPackage")}
			</Button>
			<PackageFormSheet open={open} onOpenChange={setOpen} />
		</>
	);
}

/** Drag-to-reorder package cards; clicking one opens the edit sheet. */
export function PackageList({ packages }: { packages: PackagePage }) {
	const t = useTranslations("Services");
	const { page } = packages;
	const save = useCallback(
		(ids: string[]) => reorderPackages({ page, ids }),
		[page],
	);
	const { items, reorder } = useOptimisticOrder(packages.items, save);
	const [editingId, setEditingId] = useState<string | null>(null);
	const editing = items.find((pkg) => pkg.id === editingId);

	if (packages.total === 0) {
		return (
			<EmptyState
				icon={Briefcase}
				title={t("empty.title")}
				description={t("empty.description")}
				action={<NewPackageButton />}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<p className="text-xs text-muted-foreground">{t("reorderHint")}</p>
			<SortableGrid
				items={items}
				onReorder={reorder}
				className={CARD_GRID}
				renderItem={(pkg) => (
					<PackageCard pkg={pkg} onSelect={() => setEditingId(pkg.id)} />
				)}
			/>
			<UrlPagination page={packages.page} pageCount={packages.pageCount} />
			<PackageFormSheet
				open={editing !== undefined}
				onOpenChange={(open) => !open && setEditingId(null)}
				pkg={editing}
			/>
		</div>
	);
}
