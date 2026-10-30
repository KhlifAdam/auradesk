"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	DEVICES,
	type Device,
	fitDevice,
} from "@/components/dashboard/preview/devices";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 400;

/**
 * The real site (an iframe of /preview/frame) on a desktop, tablet or phone,
 * scaled to fit its box, so the preview shows exactly what visitors get.
 */
export function LiveSitePreview({
	src,
	device = "desktop",
	focus,
	interactive = false,
	className,
}: {
	src: string;
	device?: Device;
	/** Id of a section to scroll the site to (e.g. the one being edited). */
	focus?: string;
	/** Lets the visitor scroll and click inside (the full preview). */
	interactive?: boolean;
	/** Sizes the box; a miniature by default. */
	className?: string;
}) {
	const t = useTranslations("Site.appearance.preview");
	const containerRef = useRef<HTMLDivElement>(null);
	const frameRef = useRef<HTMLIFrameElement>(null);
	// The frame's current scale, read by the wheel handler.
	const scaleRef = useRef(1);
	const [box, setBox] = useState({ width: 0, height: 0 });
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

	// The miniature ignores clicks, but the mouse wheel scrolls the site in it
	// (and not the page around it).
	useEffect(() => {
		const element = containerRef.current;
		if (!element || interactive) return;
		const onWheel = (event: WheelEvent) => {
			const frame = frameRef.current?.contentWindow;
			if (!frame) return;
			event.preventDefault();
			frame.scrollBy({ top: event.deltaY / scaleRef.current });
		};
		element.addEventListener("wheel", onWheel, { passive: false });
		return () => element.removeEventListener("wheel", onWheel);
	}, [interactive]);

	useEffect(() => {
		const element = containerRef.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) =>
			setBox({
				width: entry.contentRect.width,
				height: entry.contentRect.height,
			}),
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	const layout = fitDevice(device, box, interactive ? 16 : 8);
	scaleRef.current = layout.scale || 1;
	const isDesktop = DEVICES[device].height === null;

	return (
		<div
			ref={containerRef}
			className={cn(
				"relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40",
				className ?? "aspect-[4/5]",
			)}
		>
			<div
				className={cn(
					"shrink-0 overflow-hidden transition-all duration-300",
					isDesktop
						? "absolute inset-0"
						: "border border-border bg-card shadow-luminous",
				)}
				style={
					isDesktop
						? undefined
						: {
								padding: layout.bezel,
								borderRadius: layout.radius + layout.bezel,
							}
				}
			>
				<div
					className="relative overflow-hidden bg-background"
					style={{
						width: layout.width * layout.scale,
						height: layout.height * layout.scale,
						borderRadius: isDesktop ? 0 : layout.radius,
					}}
				>
					<iframe
						ref={frameRef}
						key={debouncedSrc}
						src={debouncedSrc}
						title={t("title")}
						tabIndex={interactive ? undefined : -1}
						onLoad={() => {
							scrollToFocus("instant");
							setLoading(false);
						}}
						className={cn(
							"absolute left-0 top-0 origin-top-left border-0 transition-opacity duration-300",
							!interactive && "pointer-events-none",
							loading ? "opacity-0" : "opacity-100",
						)}
						style={{
							width: layout.width,
							height: layout.height,
							transform: `scale(${layout.scale})`,
						}}
					/>
				</div>
			</div>
			{loading && (
				<div className="absolute inset-0 flex items-center justify-center">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
				</div>
			)}
		</div>
	);
}
