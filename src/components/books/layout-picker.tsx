"use client";

import { useTranslations } from "next-intl";
import { BOOK_SIZES_MM, type BookFormat } from "@/lib/books/formats";
import { LAYOUT_IDS, type LayoutId, slotRects } from "@/lib/books/layouts";
import { cn } from "@/lib/utils";

interface LayoutPickerProps {
	format: BookFormat;
	value: LayoutId;
	onChange: (layout: LayoutId) => void;
}

/** Every way to arrange a page, drawn as small diagrams of its photo boxes. */
export function LayoutPicker({ format, value, onChange }: LayoutPickerProps) {
	const t = useTranslations("PhotoBook.editor.layouts");
	const { w, h } = BOOK_SIZES_MM[format];

	return (
		<div className="flex flex-wrap gap-2">
			{LAYOUT_IDS.map((layout) => {
				const rects = slotRects(layout, {
					format,
					margin: "tight",
					captioned: false,
				});
				return (
					<button
						key={layout}
						type="button"
						aria-pressed={layout === value}
						aria-label={t(layout)}
						title={t(layout)}
						onClick={() => onChange(layout)}
						className={cn(
							"relative w-14 cursor-pointer rounded-sm border bg-card transition-colors duration-200 hover:border-primary/60",
							layout === value
								? "border-primary ring-1 ring-primary"
								: "border-border",
						)}
						style={{ aspectRatio: `${w} / ${h}` }}
					>
						{rects.map((rect, i) => (
							<span
								// biome-ignore lint/suspicious/noArrayIndexKey: slots are positional.
								key={i}
								className="absolute bg-foreground/35"
								style={{
									left: `${(rect.x / w) * 100}%`,
									top: `${(rect.y / h) * 100}%`,
									width: `${(rect.w / w) * 100}%`,
									height: `${(rect.h / h) * 100}%`,
								}}
							/>
						))}
					</button>
				);
			})}
		</div>
	);
}
