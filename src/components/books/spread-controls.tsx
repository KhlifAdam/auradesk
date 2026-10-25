"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { BookSpread } from "@/lib/books/design";
import type { BookAction, Side } from "@/lib/books/design-reducer";
import type { BookFormat } from "@/lib/books/formats";
import { isFullBleed } from "@/lib/books/layouts";
import { LayoutPicker } from "./layout-picker";

interface SpreadControlsProps {
	spread: BookSpread;
	format: BookFormat;
	side: Side;
	onSide: (side: Side) => void;
	dispatch: (action: BookAction) => void;
	onSlotCleared: () => void;
}

const toggleItem = "h-8 px-3 text-xs";

/** What a spread is made of: two pages or a panorama, and each page's layout and caption. */
export function SpreadControls({
	spread,
	format,
	side,
	onSide,
	dispatch,
	onSlotCleared,
}: SpreadControlsProps) {
	const t = useTranslations("PhotoBook.editor");
	const page = spread.kind === "pages" ? spread[side] : null;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1.5">
				<span className="text-xs font-medium text-muted-foreground">
					{t("spreadKind")}
				</span>
				<ToggleGroup
					type="single"
					variant="outline"
					size="sm"
					value={spread.kind}
					className="w-fit"
					onValueChange={(kind) => {
						if (!kind) return;
						onSlotCleared();
						dispatch({
							type: "kind",
							spreadId: spread.id,
							kind: kind as BookSpread["kind"],
						});
					}}
				>
					<ToggleGroupItem value="pages" className={toggleItem}>
						{t("kinds.pages")}
					</ToggleGroupItem>
					<ToggleGroupItem value="panorama" className={toggleItem}>
						{t("kinds.panorama")}
					</ToggleGroupItem>
				</ToggleGroup>
				{spread.kind === "panorama" && (
					<p className="text-xs text-muted-foreground">{t("panoramaHint")}</p>
				)}
			</div>

			{page && (
				<>
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-medium text-muted-foreground">
							{t("whichPage")}
						</span>
						<ToggleGroup
							type="single"
							variant="outline"
							size="sm"
							value={side}
							className="w-fit"
							onValueChange={(next) => next && onSide(next as Side)}
						>
							<ToggleGroupItem value="left" className={toggleItem}>
								{t("sides.left")}
							</ToggleGroupItem>
							<ToggleGroupItem value="right" className={toggleItem}>
								{t("sides.right")}
							</ToggleGroupItem>
						</ToggleGroup>
					</div>
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-medium text-muted-foreground">
							{t("layout")}
						</span>
						<LayoutPicker
							format={format}
							value={page.layout}
							onChange={(layout) => {
								onSlotCleared();
								dispatch({ type: "layout", spreadId: spread.id, side, layout });
							}}
						/>
					</div>
					{!isFullBleed(page.layout) && (
						<Input
							value={page.caption}
							maxLength={160}
							placeholder={t("captionPlaceholder")}
							aria-label={t("caption")}
							onChange={(event) =>
								dispatch({
									type: "caption",
									spreadId: spread.id,
									side,
									caption: event.target.value,
								})
							}
						/>
					)}
				</>
			)}
		</div>
	);
}
