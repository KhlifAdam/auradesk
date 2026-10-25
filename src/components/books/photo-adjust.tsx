"use client";

import { Move, RotateCcw, ZoomIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CENTERED, MAX_ZOOM, MIN_ZOOM } from "@/lib/books/crop";
import type { BookSlot } from "@/lib/books/design";

interface PhotoAdjustProps {
	slot: BookSlot;
	onChange: (crop: { x?: number; y?: number; zoom?: number }) => void;
}

/** Moving and zooming the selected photo inside its box. */
export function PhotoAdjust({ slot, onChange }: PhotoAdjustProps) {
	const t = useTranslations("PhotoBook.editor.adjust");
	const changed =
		slot.zoom !== CENTERED.zoom ||
		slot.x !== CENTERED.x ||
		slot.y !== CENTERED.y;

	return (
		<div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
			<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Move className="h-3.5 w-3.5 shrink-0" />
				{t("hint")}
			</p>
			<div className="flex items-center gap-3">
				<ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
				<Slider
					min={MIN_ZOOM}
					max={MAX_ZOOM}
					step={0.05}
					value={[slot.zoom]}
					aria-label={t("zoom")}
					onValueChange={([zoom]) => onChange({ zoom })}
				/>
				<span className="w-10 text-right text-xs tabular-nums">
					{Math.round(slot.zoom * 100)}%
				</span>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					disabled={!changed}
					aria-label={t("reset")}
					title={t("reset")}
					onClick={() => onChange(CENTERED)}
				>
					<RotateCcw className="h-3.5 w-3.5" />
				</Button>
			</div>
		</div>
	);
}
