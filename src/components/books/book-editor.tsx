"use client";

import { MessageSquareWarning, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useErrorMessage } from "@/hooks/use-error-message";
import { CENTERED, panCrop } from "@/lib/books/crop";
import { allSlots, pageCount } from "@/lib/books/design";
import {
	bookReducer,
	type Side,
	type SlotRef,
} from "@/lib/books/design-reducer";
import { firstEmptySlot, placedFor, placedSlots } from "@/lib/books/geometry";
import type { BookView } from "@/services/books/types";
import { BookHeader } from "./book-header";
import { BookSettings } from "./book-settings";
import { isLowResolution, type PanMove } from "./book-slot";
import { OrderBookDialog } from "./order-book-dialog";
import { COVER, PageStrip } from "./page-strip";
import { PageWorkspace } from "./page-workspace";
import { PhotoTray } from "./photo-tray";
import { useBookDesign } from "./use-book-design";
import { useBookTray } from "./use-book-tray";

/** The size assumed for a photo whose dimensions we don't know: a common 3:2 frame. */
const UNKNOWN_PHOTO = { w: 3, h: 2 };

/**
 * The photo book editor: photos on the left, the spread being edited in the
 * middle, the spreads along the bottom. Everything saves by itself.
 */
export function BookEditor({ book }: { book: BookView }) {
	const t = useTranslations("PhotoBook.editor");
	const errorMessage = useErrorMessage();
	const onSaveError = useCallback(
		(code: string) => toast.error(errorMessage(code)),
		[errorMessage],
	);
	const { design, dispatch, status, flush } = useBookDesign(
		book.id,
		book.design,
		onSaveError,
	);
	const tray = useBookTray(book.projectId);
	const [selected, setSelected] = useState(COVER);
	const [slotRef, setSlotRef] = useState<SlotRef | null>(null);
	const [side, setSide] = useState<Side>("left");
	// A spread that was removed leaves the cover selected.
	const spread = design.spreads.find((s) => s.id === selected);
	const current = spread ? selected : COVER;

	const photos = useMemo(
		() => ({
			...book.photos,
			...Object.fromEntries(tray.items.map((p) => [p.id, p])),
		}),
		[book.photos, tray.items],
	);
	const used = useMemo(() => {
		const counts = new Map<string, number>();
		for (const slot of allSlots(design))
			if (slot.itemId)
				counts.set(slot.itemId, (counts.get(slot.itemId) ?? 0) + 1);
		return counts;
	}, [design]);
	const lowResolution = useMemo(
		() =>
			placedSlots(design).filter(({ slot, rect, span }) =>
				isLowResolution(
					slot.itemId ? photos[slot.itemId] : undefined,
					slot,
					rect,
					design.format,
					span,
				),
			).length,
		[design, photos],
	);

	const select = (id: string) => {
		setSelected(id);
		setSlotRef(null);
	};

	/** Where a photo from the tray goes: the chosen spot, else the first empty one. */
	function pick(itemId: string) {
		const target: SlotRef | null = !spread
			? { target: "cover" }
			: slotRef && slotRef.target !== "cover" && slotRef.spreadId === spread.id
				? slotRef
				: (firstEmptySlot(spread) ??
					(spread.kind === "panorama"
						? { target: "span", spreadId: spread.id }
						: { target: side, spreadId: spread.id, index: 0 }));
		dispatch({ type: "place", ref: target, itemId });
		// Move on to the next empty spot of the spread, if there is one.
		const after = bookReducer(design, { type: "place", ref: target, itemId });
		const next = after.spreads.find((s) => s.id === spread?.id);
		setSlotRef(next ? firstEmptySlot(next) : null);
	}

	/** Dragging a photo inside its box. */
	function pan(ref: SlotRef, move: PanMove) {
		const placed = placedFor(design, ref);
		if (!placed) return;
		const photo = placed.slot.itemId ? photos[placed.slot.itemId] : undefined;
		const size =
			photo?.width && photo.height
				? { w: photo.width, h: photo.height }
				: UNKNOWN_PHOTO;
		const crop = panCrop({ ...CENTERED, ...placed.slot }, move, size, {
			w: placed.rect.w,
			h: placed.rect.h,
		});
		dispatch({ type: "adjust", ref, crop });
	}

	const unused = tray.items.filter((p) => !used.has(p.id));
	const pickLabel = !spread
		? t("pickHintCover")
		: slotRef
			? t("pickHintSelected")
			: t("pickHint");

	return (
		<div className="flex flex-col gap-4">
			<BookHeader
				projectId={book.projectId}
				projectTitle={book.projectTitle}
				title={design.title}
				status={status}
				lowResolution={lowResolution}
				action={
					<OrderBookDialog
						bookId={book.id}
						studioName={book.studioName}
						priceList={book.priceList}
						format={design.format}
						pages={pageCount(design)}
						hasCover={Boolean(design.cover.itemId)}
						flush={flush}
					/>
				}
			/>
			{book.order.statusNote && (
				<p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
					<MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
					<span>
						{t("sentBack", {
							studio: book.studioName,
							note: book.order.statusNote,
						})}
					</span>
				</p>
			)}

			<div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
				<aside className="rounded-xl border border-border bg-card p-3 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
					<Tabs defaultValue="photos">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="photos">{t("tabs.photos")}</TabsTrigger>
							<TabsTrigger value="settings">{t("tabs.settings")}</TabsTrigger>
						</TabsList>
						<TabsContent value="photos" className="mt-3">
							<PhotoTray
								tray={tray}
								used={used}
								pickLabel={pickLabel}
								onPick={pick}
							/>
						</TabsContent>
						<TabsContent value="settings" className="mt-3">
							<BookSettings
								meta={design}
								onChange={(patch) => dispatch({ type: "meta", patch })}
							/>
						</TabsContent>
					</Tabs>
				</aside>

				<section className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4">
					<PageWorkspace
						design={design}
						photos={photos}
						selected={current}
						slotRef={slotRef}
						side={side}
						onSide={setSide}
						onSlot={setSlotRef}
						onPan={pan}
						dispatch={dispatch}
					/>
					<div className="flex flex-col gap-2 border-t border-border pt-3">
						<div className="flex items-center justify-between gap-2">
							<span className="text-xs font-medium text-muted-foreground">
								{t("pagesCount", { count: pageCount(design) })}
							</span>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="h-7 gap-1.5 text-xs"
								disabled={unused.length === 0}
								onClick={() =>
									dispatch({ type: "fill", itemIds: unused.map((p) => p.id) })
								}
							>
								<Wand2 className="h-3.5 w-3.5" />
								{t("fill", { count: unused.length })}
							</Button>
						</div>
						<PageStrip
							design={design}
							photos={photos}
							selected={current}
							onSelect={select}
							onMove={(from, to) => dispatch({ type: "move", from, to })}
							onAdd={() => dispatch({ type: "addSpread" })}
						/>
					</div>
				</section>
			</div>
		</div>
	);
}
