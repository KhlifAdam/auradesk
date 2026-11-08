"use client";

import { animate, motion, useMotionValue } from "framer-motion";
import { usePathname } from "next/navigation";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { cn } from "@/lib/utils";

export type DockSide = "left" | "right";

interface DockPlace {
	side: DockSide;
	/** Offset from the default spot, in px; negative is higher. */
	y: number;
}

/** Gap kept between the launcher and the screen edges. */
const EDGE = 12;
/** Pages with a message composer start higher, clear of the send button. */
const COMPOSER_LIFT = -84;
const SPRING = { type: "spring", stiffness: 380, damping: 34 } as const;
/** Where it starts until moved: the bottom-right corner. */
const DEFAULT_SIDE: DockSide = "right";

function readPlace(key: string): DockPlace | null {
	try {
		const raw = localStorage.getItem(key);
		const place = raw ? (JSON.parse(raw) as DockPlace) : null;
		return place && typeof place.y === "number" ? place : null;
	} catch {
		return null;
	}
}

function savePlace(key: string, place: DockPlace) {
	try {
		localStorage.setItem(key, JSON.stringify(place));
	} catch {
		// Blocked storage: the launcher just starts at its default spot again.
	}
}

/**
 * Makes an assistant launcher draggable, so it never hides what is under it
 * (e.g. the send button). It snaps to the nearest side edge when dropped and
 * remembers its spot, separately on message pages. It starts bottom right;
 * `className` gives that fixed spot.
 */
export function LauncherDock({
	storageKey,
	className,
	children,
}: {
	storageKey: string;
	className: string;
	children: (dock: { side: DockSide; wasDragged: () => boolean }) => ReactNode;
}) {
	const onMessages = usePathname().includes("/messages");
	const key = `${storageKey}:${onMessages ? "messages" : "page"}`;
	const ref = useRef<HTMLDivElement>(null);
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const [side, setSide] = useState<DockSide>(DEFAULT_SIDE);
	const dragged = useRef(false);

	/** Puts the launcher against `side`, with its top and bottom on screen. */
	const place = useCallback(
		(next: DockPlace, smooth: boolean) => {
			const el = ref.current;
			if (!el) return;
			const rect = el.getBoundingClientRect();
			// Where it sits with no offset: the CSS default spot.
			const left = rect.left - x.get();
			const top = rect.top - y.get();
			const targetX = next.side === "left" ? EDGE - left : 0;
			const minY = EDGE - top;
			const maxY = window.innerHeight - EDGE - (top + rect.height);
			const targetY = Math.min(Math.max(next.y, minY), Math.max(maxY, minY));
			setSide(next.side);
			if (smooth) {
				animate(x, targetX, SPRING);
				animate(y, targetY, SPRING);
			} else {
				x.set(targetX);
				y.set(targetY);
			}
			return { side: next.side, y: targetY };
		},
		[x, y],
	);

	const current = useRef<DockPlace>({ side: DEFAULT_SIDE, y: 0 });
	useLayoutEffect(() => {
		current.current = readPlace(key) ?? {
			side: DEFAULT_SIDE,
			y: onMessages ? COMPOSER_LIFT : 0,
		};
		place(current.current, false);
	}, [key, onMessages, place]);

	// Re-place when the window or the launcher itself (shown, hidden) resizes.
	useEffect(() => {
		const el = ref.current;
		const onResize = () => place(current.current, false);
		window.addEventListener("resize", onResize);
		const observer = new ResizeObserver(onResize);
		if (el) observer.observe(el);
		return () => {
			window.removeEventListener("resize", onResize);
			observer.disconnect();
		};
	}, [place]);

	const drop = () => {
		const el = ref.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const next: DockSide =
			rect.left + rect.width / 2 < window.innerWidth / 2 ? "left" : "right";
		const placed = place({ side: next, y: y.get() }, true);
		if (!placed) return;
		current.current = placed;
		savePlace(key, placed);
	};

	return (
		<motion.div
			ref={ref}
			drag
			dragMomentum={false}
			dragElastic={0.08}
			style={{ x, y, touchAction: "none" }}
			onDragStart={() => {
				dragged.current = true;
			}}
			onDragEnd={() => {
				drop();
				// The click that ends a drag must not open the assistant.
				window.setTimeout(() => {
					dragged.current = false;
				}, 0);
			}}
			className={cn("cursor-grab active:cursor-grabbing", className)}
		>
			{children({ side, wasDragged: () => dragged.current })}
		</motion.div>
	);
}
