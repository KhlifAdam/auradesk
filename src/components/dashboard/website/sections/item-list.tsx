"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ItemListProps {
	/** The field-array ids, one per item. */
	ids: string[];
	max: number;
	addLabel: string;
	onAdd: () => void;
	onRemove: (index: number) => void;
	onMove: (from: number, to: number) => void;
	renderItem: (index: number) => ReactNode;
}

/** The repeated entries of a section (logos, quotes…): add, move, remove. */
export function ItemList({
	ids,
	max,
	addLabel,
	onAdd,
	onRemove,
	onMove,
	renderItem,
}: ItemListProps) {
	const t = useTranslations("Site.sections.items");
	const icon = "h-7 w-7 text-muted-foreground";

	return (
		<div className="flex flex-col gap-2">
			{ids.map((id, index) => (
				<div
					key={id}
					className="flex gap-2 rounded-lg border border-border bg-background/60 p-3"
				>
					<div className="min-w-0 flex-1">{renderItem(index)}</div>
					<div className="flex shrink-0 flex-col gap-0.5">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className={icon}
							disabled={index === 0}
							onClick={() => onMove(index, index - 1)}
							aria-label={t("up")}
						>
							<ArrowUp className="h-3.5 w-3.5" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className={icon}
							disabled={index === ids.length - 1}
							onClick={() => onMove(index, index + 1)}
							aria-label={t("down")}
						>
							<ArrowDown className="h-3.5 w-3.5" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className={`${icon} hover:text-destructive`}
							onClick={() => onRemove(index)}
							aria-label={t("remove")}
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			))}
			<div className="flex items-center gap-3">
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 w-fit gap-1.5 text-xs"
					disabled={ids.length >= max}
					onClick={onAdd}
				>
					<Plus className="h-3.5 w-3.5" />
					{addLabel}
				</Button>
				<span className="text-xs text-muted-foreground">
					{t("count", { count: ids.length, max })}
				</span>
			</div>
		</div>
	);
}
