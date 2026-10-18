"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { reveal } from "./animations";

const ITEMS = [
	{ id: "maya", image: "/images/auradesk-gallery.jpg" },
	{ id: "theo", image: "/images/auradesk-portrait.jpg" },
	{ id: "nina", image: "/images/auradesk-editorial.jpg" },
] as const;

const STARS = ["s1", "s2", "s3", "s4", "s5"];

export function Testimonials() {
	const t = useTranslations("Landing.testimonials");

	return (
		<section className="mx-auto max-w-6xl px-5 py-24 md:py-32">
			<motion.div {...reveal} className="text-center">
				<p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
					{t("eyebrow")}
				</p>
				<h2 className="mt-3 text-4xl font-semibold md:text-5xl">
					{t("title")}
				</h2>
			</motion.div>
			<div className="mt-12 grid gap-4 md:grid-cols-3">
				{ITEMS.map(({ id, image }, i) => (
					<motion.article
						key={id}
						{...reveal}
						transition={{ ...reveal.transition, delay: i * 0.1 }}
						className={cn(
							"rounded-xl border border-border bg-card/80 p-6 backdrop-blur",
							i === 1 && "md:-translate-y-5",
						)}
					>
						<Quote className="size-6 text-primary" />
						<div className="mt-5 flex gap-1">
							{STARS.map((star) => (
								<Star
									key={star}
									className="size-3.5 fill-primary text-primary"
								/>
							))}
						</div>
						<p className="mt-5 leading-7">“{t(`items.${id}.quote`)}”</p>
						<div className="mt-7 flex items-center gap-3">
							<Image
								src={image}
								alt={t(`items.${id}.name`)}
								width={1200}
								height={1504}
								className="size-10 rounded-full object-cover"
							/>
							<div>
								<p className="text-sm font-semibold">{t(`items.${id}.name`)}</p>
								<p className="text-xs text-muted-foreground">
									{t(`items.${id}.role`)}
								</p>
							</div>
						</div>
					</motion.article>
				))}
			</div>
		</section>
	);
}
