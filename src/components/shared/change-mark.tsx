import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** What is waiting for the viewer on an item (see `changeMark`). */
export type ChangeMark = "new" | "updated" | null;

/** Border of a card holding something new or changed for its viewer. */
export const changeHighlight = (mark: ChangeMark) =>
	mark ? "border-primary ring-2 ring-primary/20" : "";

/** The same for a row of a divided list: a tinted row with a coloured edge. */
export const changeRowHighlight = (mark: ChangeMark) =>
	mark ? "bg-primary/5 shadow-[inset_3px_0_0_var(--primary)]" : "";

/** "New" or "Updated" next to an item's title; nothing when all is seen. */
export function ChangePill({
	mark,
	className,
}: {
	mark: ChangeMark;
	className?: string;
}) {
	const t = useTranslations("Changes");
	if (!mark) return null;
	return (
		<span
			className={cn(
				"shrink-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground",
				className,
			)}
		>
			{t(mark)}
		</span>
	);
}
