"use client";

import type { CSSProperties } from "react";
import type { BookDesign } from "@/lib/books/design";
import { BACKGROUND_HEX, BOOK_SIZES_MM } from "@/lib/books/formats";
import type { Rect } from "@/lib/books/layouts";
import { cn } from "@/lib/utils";

export type PageLook = Pick<BookDesign, "format" | "margin" | "background">;

/**
 * A page's frame: the book's colour, in the page's exact proportions, and a
 * container so that text can scale with the page (`cqw` = 1% of its width).
 * `span` makes it two pages wide, for a panorama.
 */
export function PageFrame({
	look,
	span,
	className,
	children,
}: {
	look: PageLook;
	span?: boolean;
	className?: string;
	children: React.ReactNode;
}) {
	const { w, h } = BOOK_SIZES_MM[look.format];
	const style: CSSProperties = {
		aspectRatio: `${span ? w * 2 : w} / ${h}`,
		backgroundColor: BACKGROUND_HEX[look.background],
		containerType: "inline-size",
	};
	return (
		<div
			className={cn("relative w-full overflow-hidden shadow-sm", className)}
			style={style}
		>
			{children}
		</div>
	);
}

export const percent = (value: number, total: number) =>
	`${(value / total) * 100}%`;
export const place = (r: Rect, w: number, h: number): CSSProperties => ({
	left: percent(r.x, w),
	top: percent(r.y, h),
	width: percent(r.w, w),
	height: percent(r.h, h),
});
export const cqw = (mm: number, pageW: number) => `${(mm / pageW) * 100}cqw`;
