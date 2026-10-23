"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** The site is rendered at this desktop width, then scaled to fit the panel. */
const SITE_WIDTH = 1440;
const DEBOUNCE_MS = 400;

/**
 * Miniature of the real site (an iframe of /preview/frame), so the panel shows
 * exactly what visitors get instead of an approximation.
 */
export function LiveSitePreview({
	src,
	focus,
}: {
	src: string;
	/** Id of a section to scroll the site to (e.g. the one being edited). */
	focus?: string;
}) {
	const t = useTranslations("Site.appearance.preview");
	const containerRef = useRef<HTMLDivElement>(null);
	const frameRef = useRef<HTMLIFrameElement>(null);
	const [scale, setScale] = useState(0.3);
	const [height, setHeight] = useState(0);
	const [debouncedSrc, setDebouncedSrc] = useState(src);
	const [loading, setLoading] = useState(true);

	// Rapid edits (typing a hex color) shouldn't reload the frame each keystroke.
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSrc(src), DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [src]);

	useEffect(() => setLoading(true), [debouncedSrc]);

	// The frame is same-origin, so it can be scrolled to the focused section.
	const scrollToFocus = useCallback(
		(behavior: ScrollBehavior) => {
			const frame = frameRef.current?.contentWindow;
			const target = focus && frame?.document.getElementById(focus);
			if (frame && target) frame.scrollTo({ top: target.offsetTop, behavior });
		},
		[focus],
	);

	useEffect(() => {
		if (!loading) scrollToFocus("smooth");
	}, [loading, scrollToFocus]);

	useEffect(() => {
		const element = containerRef.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) => {
			setScale(entry.contentRect.width / SITE_WIDTH);
			setHeight(entry.contentRect.height);
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={containerRef}
			className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-border bg-muted/40"
		>
			<iframe
				ref={frameRef}
				key={debouncedSrc}
				src={debouncedSrc}
				title={t("title")}
				tabIndex={-1}
				onLoad={() => {
					scrollToFocus("instant");
					setLoading(false);
				}}
				className={cn(
					"pointer-events-none absolute left-0 top-0 origin-top-left border-0 transition-opacity duration-300",
					loading ? "opacity-0" : "opacity-100",
				)}
				style={{
					width: SITE_WIDTH,
					height: scale > 0 ? height / scale : 0,
					transform: `scale(${scale})`,
				}}
			/>
			{loading && (
				<div className="absolute inset-0 flex items-center justify-center">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
				</div>
			)}
		</div>
	);
}
