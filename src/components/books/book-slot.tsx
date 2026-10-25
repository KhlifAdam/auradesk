"use client";

import { AlertTriangle, Plus, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { type CSSProperties, type KeyboardEvent, useRef } from "react";
import { cropStyle } from "@/lib/books/crop";
import type { BookSlot } from "@/lib/books/design";
import { type BookFormat, MIN_DPI } from "@/lib/books/formats";
import { printDpi, type Rect, withBleed } from "@/lib/books/layouts";
import { cn } from "@/lib/utils";
import type { BookPhoto } from "@/services/books/types";

/** How far a drag or an arrow key moved the photo, as a fraction of its box. */
export interface PanMove {
	dx: number;
	dy: number;
}

/** Whether a photo is too small to print sharp in its spot. */
export function isLowResolution(
	photo: BookPhoto | undefined,
	slot: BookSlot,
	rect: Rect,
	format: BookFormat,
	span = false,
) {
	if (!photo?.width || !photo.height) return false;
	return (
		printDpi(
			{ width: photo.width, height: photo.height },
			withBleed(rect, format, span),
			slot.zoom,
		) < MIN_DPI
	);
}

const KEY_STEP = 0.03;
const ARROWS: Record<string, PanMove> = {
	ArrowLeft: { dx: -KEY_STEP, dy: 0 },
	ArrowRight: { dx: KEY_STEP, dy: 0 },
	ArrowUp: { dx: 0, dy: -KEY_STEP },
	ArrowDown: { dx: 0, dy: KEY_STEP },
};

interface BookSlotViewProps {
	slot: BookSlot;
	photo: BookPhoto | undefined;
	/** Where it sits inside its page frame (percentages). */
	placement: CSSProperties;
	label: string;
	/** Small copies in the page strip: no controls, no warnings. */
	thumbnail?: boolean;
	selected?: boolean;
	lowResolution?: boolean;
	onSelect?: () => void;
	onClear?: () => void;
	onPan?: (move: PanMove) => void;
}

/**
 * One spot for a photo. Click to select it; once selected, drag the photo (or
 * use the arrow keys) to move it inside its box. The empty spot shows a plus.
 */
export function BookSlotView({
	slot,
	photo,
	placement,
	label,
	thumbnail,
	selected,
	lowResolution,
	onSelect,
	onClear,
	onPan,
}: BookSlotViewProps) {
	const t = useTranslations("PhotoBook.editor");
	const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
	const movable = Boolean(selected && photo);

	function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
		if (!movable) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		drag.current = { x: event.clientX, y: event.clientY, moved: false };
	}

	function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
		const start = drag.current;
		if (!start) return;
		const box = event.currentTarget.getBoundingClientRect();
		if (
			!start.moved &&
			Math.hypot(event.clientX - start.x, event.clientY - start.y) < 3
		)
			return;
		start.moved = true;
		onPan?.({
			dx: (event.clientX - start.x) / box.width,
			dy: (event.clientY - start.y) / box.height,
		});
		start.x = event.clientX;
		start.y = event.clientY;
	}

	function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
		const move = movable && ARROWS[event.key];
		if (!move) return;
		event.preventDefault();
		onPan?.(move);
	}

	return (
		<div
			className={cn(
				"group absolute overflow-hidden",
				!photo && "border border-dashed border-foreground/25 bg-foreground/5",
				selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
			)}
			style={placement}
		>
			{photo ? (
				<Image
					src={photo.url}
					alt={photo.filename}
					fill
					unoptimized
					draggable={false}
					sizes={thumbnail ? "120px" : "640px"}
					className="object-cover"
					style={cropStyle(slot)}
				/>
			) : (
				!thumbnail && (
					<Plus className="absolute inset-0 m-auto h-5 w-5 text-foreground/40" />
				)
			)}
			{!thumbnail && (
				<button
					type="button"
					aria-label={label}
					aria-pressed={selected}
					onClick={() => {
						// A drag that ends on the button isn't a click.
						if (drag.current?.moved) drag.current = null;
						else onSelect?.();
					}}
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={() => {
						if (!drag.current?.moved) drag.current = null;
					}}
					onKeyDown={onKeyDown}
					className={cn(
						"absolute inset-0 touch-none focus-visible:outline-none",
						movable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
					)}
				/>
			)}
			{lowResolution && (
				<span
					title={t("lowResolution")}
					className="pointer-events-none absolute left-1 top-1 flex items-center gap-1 rounded bg-warning px-1 py-0.5 text-[10px] font-medium text-black"
				>
					<AlertTriangle className="h-3 w-3" />
					{t("lowResolutionShort")}
				</span>
			)}
			{!thumbnail && photo && onClear && (
				<button
					type="button"
					aria-label={t("clearSlot")}
					onClick={onClear}
					className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
				>
					<X className="h-3 w-3" />
				</button>
			)}
		</div>
	);
}
