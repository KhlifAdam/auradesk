"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	horizontalListSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import type { BookDesign, BookSpread } from "@/lib/books/design";
import { MAX_SPREADS } from "@/lib/books/formats";
import { cn } from "@/lib/utils";
import { BookCoverView } from "./book-cover-view";
import type { BookPhotos } from "./book-page-view";
import { SpreadView } from "./spread-view";

export const COVER = "cover";

interface PageStripProps {
	design: BookDesign;
	photos: BookPhotos;
	selected: string;
	onSelect: (id: string) => void;
	onMove: (from: number, to: number) => void;
	onAdd: () => void;
	/** The book is sent: pages can't be changed any more. */
	locked?: boolean;
}

/** The book as a row of spreads: pick one to edit, drag to reorder. */
export function PageStrip({
	design,
	photos,
	selected,
	onSelect,
	onMove,
	onAdd,
	locked,
}: PageStripProps) {
	const t = useTranslations("PhotoBook.editor");
	const dndId = useId();
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);
	const ids = design.spreads.map((spread) => spread.id);

	function onDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) return;
		onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
	}

	return (
		<div className="flex gap-3 overflow-x-auto pb-2">
			<Tile
				label={t("cover")}
				active={selected === COVER}
				onClick={() => onSelect(COVER)}
				className="w-20"
			>
				<BookCoverView
					look={design}
					design={design}
					photos={photos}
					thumbnail
				/>
			</Tile>
			<DndContext
				id={dndId}
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={onDragEnd}
			>
				<SortableContext items={ids} strategy={horizontalListSortingStrategy}>
					{design.spreads.map((spread, index) => (
						<SortableTile
							key={spread.id}
							spread={spread}
							label={t("spreadLabel", {
								from: index * 2 + 1,
								to: index * 2 + 2,
							})}
							active={selected === spread.id}
							disabled={locked}
							onSelect={() => onSelect(spread.id)}
						>
							<SpreadView
								look={design}
								spread={spread}
								photos={photos}
								thumbnail
							/>
						</SortableTile>
					))}
				</SortableContext>
			</DndContext>
			{!locked && design.spreads.length < MAX_SPREADS && (
				<button
					type="button"
					aria-label={t("addSpread")}
					title={t("addSpread")}
					onClick={onAdd}
					className="flex min-h-14 w-20 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-dashed border-border text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
				>
					<Plus className="h-5 w-5" />
				</button>
			)}
		</div>
	);
}

interface TileProps {
	label: string;
	active: boolean;
	onClick: () => void;
	className?: string;
	children: React.ReactNode;
}

function Tile({ label, active, onClick, className, children }: TileProps) {
	return (
		<div className={cn("flex shrink-0 flex-col gap-1", className)}>
			<button
				type="button"
				aria-pressed={active}
				onClick={onClick}
				className={cn(
					"cursor-pointer rounded-sm outline-none ring-offset-2 ring-offset-background transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-primary",
					active ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary/40",
				)}
			>
				{children}
			</button>
			<span className="text-center text-[10px] text-muted-foreground">
				{label}
			</span>
		</div>
	);
}

function SortableTile({
	spread,
	label,
	active,
	disabled,
	onSelect,
	children,
}: {
	spread: BookSpread;
	label: string;
	active: boolean;
	disabled?: boolean;
	onSelect: () => void;
	children: React.ReactNode;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: spread.id, disabled });
	return (
		<div
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn(
				"w-40 shrink-0 touch-none",
				isDragging && "z-10 opacity-70",
			)}
		>
			<Tile label={label} active={active} onClick={onSelect}>
				{children}
			</Tile>
		</div>
	);
}
