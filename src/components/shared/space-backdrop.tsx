import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * The living background of a space: soft glows of the space's colour (gold
 * for studios, green for clients) floating slowly over a faint grid. Put it first inside a
 * `relative isolate` container: it sits behind the content and takes no clicks.
 * The colours follow the space's tokens (see `data-space` in globals.css).
 */
export function SpaceBackdrop({
	className,
	style,
}: {
	/** `fixed` keeps the glow in view on a long page. */
	className?: string;
	/** Override a token, e.g. `--space-alt` for a two-colour hub. */
	style?: CSSProperties;
}) {
	return (
		<div
			aria-hidden
			style={style}
			className={cn(
				"pointer-events-none absolute inset-0 -z-10 overflow-hidden print:hidden",
				className,
			)}
		>
			<span className="space-blob space-blob-a" />
			<span className="space-blob space-blob-b" />
			<span className="space-blob space-blob-c" />
			<span className="grid-fade absolute inset-0 opacity-40" />
		</div>
	);
}
