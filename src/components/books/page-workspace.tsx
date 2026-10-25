"use client";

import { Copy, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { BookDesign } from "@/lib/books/design";
import type { BookAction, Side, SlotRef } from "@/lib/books/design-reducer";
import { MAX_SPREADS } from "@/lib/books/formats";
import { placedFor } from "@/lib/books/geometry";
import { cn } from "@/lib/utils";
import { BookCoverView } from "./book-cover-view";
import type { BookPhotos } from "./book-page-view";
import type { PanMove } from "./book-slot";
import { PhotoAdjust } from "./photo-adjust";
import { SpreadControls } from "./spread-controls";
import { SpreadView } from "./spread-view";

/** A tall page needs a narrower canvas than a wide one to fit on screen. */
const CANVAS_WIDTH = {
	landscape: "max-w-5xl",
	square: "max-w-3xl",
	portrait: "max-w-2xl",
} as const;

interface PageWorkspaceProps {
	design: BookDesign;
	photos: BookPhotos;
	selected: string;
	slotRef: SlotRef | null;
	side: Side;
	onSide: (side: Side) => void;
	onSlot: (ref: SlotRef | null) => void;
	onPan: (ref: SlotRef, move: PanMove) => void;
	dispatch: (action: BookAction) => void;
}

/** The cover or the spread being edited: a big preview and what it is made of. */
export function PageWorkspace({
	design,
	photos,
	selected,
	slotRef,
	side,
	onSide,
	onSlot,
	onPan,
	dispatch,
}: PageWorkspaceProps) {
	const t = useTranslations("PhotoBook.editor");
	const spread = design.spreads.find((s) => s.id === selected);
	const index = spread ? design.spreads.indexOf(spread) : -1;
	const canvas = cn("mx-auto w-full", CANVAS_WIDTH[design.format]);
	const toggle = (ref: SlotRef) => {
		const same = slotRef && JSON.stringify(slotRef) === JSON.stringify(ref);
		onSlot(same ? null : ref);
		if (ref.target === "left" || ref.target === "right") onSide(ref.target);
	};
	const placed = slotRef ? placedFor(design, slotRef) : null;
	const adjustable = placed?.slot.itemId ? placed : null;

	const adjust = adjustable && slotRef && (
		<PhotoAdjust
			slot={adjustable.slot}
			onChange={(crop) => dispatch({ type: "adjust", ref: slotRef, crop })}
		/>
	);

	if (!spread)
		return (
			<div className="flex flex-col gap-3">
				<h2 className="text-sm font-semibold">{t("cover")}</h2>
				<div className={cn(canvas, "max-w-md")}>
					<BookCoverView
						look={design}
						design={design}
						photos={photos}
						selected={slotRef?.target === "cover"}
						onSelect={() => toggle({ target: "cover" })}
						onClear={() =>
							dispatch({
								type: "place",
								ref: { target: "cover" },
								itemId: null,
							})
						}
						onPan={(move) => onPan({ target: "cover" }, move)}
					/>
				</div>
				<p className="text-center text-xs text-muted-foreground">
					{t(design.cover.itemId ? "coverHint" : "coverEmptyHint")}
				</p>
				<div className="mx-auto w-full max-w-md">{adjust}</div>
			</div>
		);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-2">
				<h2 className="text-sm font-semibold">
					{t("spreadOf", { number: index + 1, total: design.spreads.length })}
				</h2>
				<div className="flex gap-1">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						aria-label={t("duplicateSpread")}
						title={t("duplicateSpread")}
						disabled={design.spreads.length >= MAX_SPREADS}
						onClick={() => dispatch({ type: "duplicate", spreadId: spread.id })}
					>
						<Copy className="h-4 w-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-destructive hover:text-destructive"
						aria-label={t("removeSpread")}
						title={t("removeSpread")}
						onClick={() => dispatch({ type: "remove", spreadId: spread.id })}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
			<div className={canvas}>
				<SpreadView
					look={design}
					spread={spread}
					photos={photos}
					selected={slotRef}
					onSelect={toggle}
					onClear={(ref) => dispatch({ type: "place", ref, itemId: null })}
					onPan={onPan}
				/>
			</div>
			{adjust}
			<SpreadControls
				spread={spread}
				format={design.format}
				side={side}
				onSide={onSide}
				dispatch={dispatch}
				onSlotCleared={() => onSlot(null)}
			/>
		</div>
	);
}
