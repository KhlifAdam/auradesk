"use client";

import { motion } from "framer-motion";
import { ArrowDown, Sparkles } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Decorative photos floating around the headline (large screens only). */
const PHOTOS = [
	{
		src: "/images/auradesk-portrait.jpg",
		className: "left-[1%] top-10 h-56 w-44 -rotate-6",
		delay: 0.25,
	},
	{
		src: "/images/auradesk-editorial.jpg",
		className: "left-[9%] top-72 h-32 w-48 rotate-3",
		delay: 0.4,
	},
	{
		src: "/images/auradesk-gallery.jpg",
		className: "right-[1%] top-16 h-60 w-48 rotate-6",
		delay: 0.32,
	},
] as const;

export function HomeHero() {
	const t = useTranslations("Home");

	return (
		<section className="relative mx-auto max-w-7xl px-5 pb-10 pt-12 text-center md:pt-20">
			{PHOTOS.map(({ src, className, delay }) => (
				<motion.div
					key={src}
					aria-hidden
					initial={{ opacity: 0, y: 24, scale: 0.94 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.9, delay, ease: EASE }}
					className={cn("absolute hidden xl:block", className)}
				>
					<motion.div
						animate={{ y: [0, -8, 0] }}
						transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
						className="relative h-full w-full overflow-hidden rounded-2xl border border-border/70 shadow-2xl ring-1 ring-white/10"
					>
						<Image
							src={src}
							alt=""
							fill
							sizes="12rem"
							loading="eager"
							fetchPriority="high"
							className="object-cover"
						/>
					</motion.div>
				</motion.div>
			))}

			<motion.div
				initial={{ opacity: 0, y: 28 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, ease: EASE }}
				className="relative mx-auto max-w-3xl"
			>
				<span className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
					<Sparkles className="size-3.5 text-primary" /> {t("badge")}
				</span>
				<h1 className="text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
					{t("titleStart")}{" "}
					<span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
						{t("titleAccent")}
					</span>
				</h1>
				<p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-7 text-muted-foreground md:text-lg">
					{t("subtitle", { brand: BRAND_NAME })}
				</p>
				<a
					href="#spaces"
					className="mt-10 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-300 hover:text-foreground"
				>
					{t("choose")}
					<motion.span
						animate={{ y: [0, 4, 0] }}
						transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
					>
						<ArrowDown className="size-3.5" />
					</motion.span>
				</a>
			</motion.div>
		</section>
	);
}
