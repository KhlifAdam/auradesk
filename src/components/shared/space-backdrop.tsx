import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Rising lights: where they start, how big, how long a rise takes. */
const BOKEH = [
	{ x: "8%", size: "7rem", dur: "19s", delay: "0s", drift: "6vw" },
	{ x: "27%", size: "4.5rem", dur: "24s", delay: "5s", drift: "-4vw" },
	{ x: "46%", size: "9rem", dur: "28s", delay: "11s", drift: "5vw" },
	{ x: "66%", size: "5rem", dur: "21s", delay: "3s", drift: "-6vw" },
	{ x: "84%", size: "8rem", dur: "26s", delay: "8s", drift: "-3vw" },
] as const;

/**
 * The living background of a space (studio or client). Put it first inside a
 * `relative isolate` container: it sits behind the content and takes no clicks.
 * Its colours follow the space's tokens (see `data-space` in globals.css).
 */
export function SpaceBackdrop({
	className,
	style,
}: {
	/** `fixed` keeps the lights in view on a long page. */
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
			{BOKEH.map(({ x, size, dur, delay, drift }) => (
				<span
					key={x}
					className="space-bokeh"
					style={
						{
							"--x": x,
							"--size": size,
							"--dur": dur,
							"--delay": delay,
							"--drift": drift,
						} as CSSProperties
					}
				/>
			))}
		</div>
	);
}
