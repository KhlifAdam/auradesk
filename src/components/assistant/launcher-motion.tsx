"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const SMOOTH = [0.45, 0, 0.55, 1] as const;

/**
 * The motion shared by the assistant launchers (dashboard and portal): a
 * floating bob, a glowing pulse ring, a light sweep and a tilting icon, so
 * the button gets noticed. Everything stops when reduced motion is on.
 */
export function useLauncherMotion() {
	const still = useReducedMotion() ?? false;
	return {
		still,
		float: still
			? {}
			: {
					animate: { y: [0, -7, 0] },
					transition: { duration: 2.6, repeat: Infinity, ease: SMOOTH },
				},
	};
}

/** Pulse rings and the light sweep, drawn behind and over the button. */
export function LauncherEffects({ still }: { still: boolean }) {
	if (still) return null;
	return (
		<>
			{[0, 0.9].map((delay) => (
				<motion.span
					key={delay}
					aria-hidden
					className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary"
					initial={{ scale: 1, opacity: 0 }}
					animate={{ scale: [1, 1.45], opacity: [0.55, 0] }}
					transition={{
						duration: 1.8,
						delay,
						repeat: Infinity,
						repeatDelay: 0,
						ease: [0.22, 1, 0.36, 1],
					}}
				/>
			))}
			<span
				aria-hidden
				className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
			>
				<motion.span
					className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent"
					initial={{ left: "-40%" }}
					animate={{ left: ["-40%", "140%"] }}
					transition={{
						duration: 1.2,
						repeat: Infinity,
						repeatDelay: 2.4,
						ease: SMOOTH,
					}}
				/>
			</span>
		</>
	);
}

/** The icon, tilting hello every few seconds. */
export function LauncherIcon({
	still,
	children,
}: {
	still: boolean;
	children: ReactNode;
}) {
	return (
		<motion.span
			className="relative flex"
			animate={
				still ? undefined : { rotate: [0, -16, 12, 0], scale: [1, 1.15, 1] }
			}
			transition={
				still
					? undefined
					: { duration: 1, repeat: Infinity, repeatDelay: 2.6, ease: SMOOTH }
			}
		>
			{children}
		</motion.span>
	);
}
