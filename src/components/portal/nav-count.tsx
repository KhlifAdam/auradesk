import { cn } from "@/lib/utils";

/** A small count on a nav entry; hidden when there is nothing waiting. */
export function NavCount({
	count,
	className,
}: {
	count: number | undefined;
	className?: string;
}) {
	if (!count || count <= 0) return null;
	return (
		<span
			className={cn(
				"flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground",
				className,
			)}
		>
			{count > 99 ? "99+" : count}
		</span>
	);
}
