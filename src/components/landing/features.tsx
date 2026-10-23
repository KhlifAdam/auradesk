"use client";

import { motion } from "framer-motion";
import {
	Aperture,
	Bot,
	Check,
	ChevronRight,
	Users,
	WandSparkles,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { reveal } from "./animations";

const CRM_STEPS = ["contract", "invoice", "questionnaire"] as const;

export function Features() {
	const t = useTranslations("Landing.features");

	return (
		<section id="features" className="mx-auto max-w-6xl px-5 py-24 md:py-32">
			<motion.div {...reveal} className="max-w-2xl">
				<p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-primary">
					{t("eyebrow")}
				</p>
				<h2 className="text-4xl font-semibold leading-tight md:text-6xl">
					{t("title")}
				</h2>
				<p className="mt-5 text-muted-foreground">{t("subtitle")}</p>
			</motion.div>
			<div className="mt-12 grid auto-rows-[300px] grid-cols-1 gap-4 md:grid-cols-6">
				<motion.article
					{...reveal}
					whileHover={{ y: -5 }}
					className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-luminous md:col-span-4"
				>
					<div className="relative z-10">
						<Users className="size-5 text-primary" />
						<h3 className="mt-4 text-xl font-semibold">{t("crm.title")}</h3>
						<p className="mt-2 max-w-xs text-sm text-muted-foreground">
							{t("crm.description")}
						</p>
					</div>
					<div className="absolute -bottom-5 right-[-4%] w-[68%] rounded-lg border border-border bg-background p-4 shadow-xl">
						<div className="flex items-center gap-3">
							<Image
								src="/images/auradesk-portrait.jpg"
								alt={t("crm.avatarAlt")}
								width={1200}
								height={1504}
								className="size-10 rounded-full object-cover"
							/>
							<div>
								<p className="text-xs font-semibold">{t("crm.name")}</p>
								<p className="text-[10px] text-muted-foreground">
									{t("crm.meta")}
								</p>
							</div>
							<span className="ml-auto rounded-full bg-chart-2/15 px-2 py-1 text-[9px] text-chart-2">
								{t("crm.status")}
							</span>
						</div>
						{CRM_STEPS.map((step, i) => (
							<div
								key={step}
								className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground"
							>
								<Check className="size-3 text-chart-2" />
								{t(`crm.steps.${step}`)}
								<span className="ml-auto">
									{t("crm.daysAgo", { count: i + 1 })}
								</span>
							</div>
						))}
					</div>
				</motion.article>
				<motion.article
					{...reveal}
					whileHover={{ y: -5 }}
					className="relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-luminous md:col-span-2 md:row-span-2"
				>
					<Aperture className="size-5 text-primary" />
					<h3 className="mt-4 text-xl font-semibold">{t("galleries.title")}</h3>
					<p className="mt-2 text-sm text-muted-foreground">
						{t("galleries.description")}
					</p>
					<div className="relative mt-7 h-[390px]">
						<motion.div
							whileHover={{ rotate: -2, scale: 1.02 }}
							className="absolute left-2 top-2 h-72 w-48 -rotate-6 rounded-md border-[6px] border-card bg-muted shadow-xl"
						>
							<Image
								src="/images/auradesk-gallery.jpg"
								alt={t("galleries.weddingAlt")}
								fill
								sizes="12rem"
								className="rounded-sm object-cover"
							/>
						</motion.div>
						<motion.div
							whileHover={{ rotate: 2, scale: 1.02 }}
							className="absolute left-12 top-24 h-52 w-48 rotate-6 rounded-md border-[6px] border-card bg-muted shadow-xl"
						>
							<Image
								src="/images/auradesk-editorial.jpg"
								alt={t("galleries.editorialAlt")}
								fill
								sizes="12rem"
								className="rounded-sm object-cover"
							/>
						</motion.div>
					</div>
				</motion.article>
				<motion.article
					{...reveal}
					whileHover={{ y: -5 }}
					className="relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-luminous md:col-span-2"
				>
					<div className="absolute right-4 top-4 size-24 rounded-full bg-primary/25 blur-2xl" />
					<WandSparkles className="relative size-5 text-primary" />
					<h3 className="mt-4 text-xl font-semibold">{t("ai.title")}</h3>
					<p className="mt-2 text-sm text-muted-foreground">
						{t("ai.description")}
					</p>
					<div className="mt-6 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
						<Bot className="size-5 text-primary" />
						{t("ai.ready")}
						<ChevronRight className="ml-auto size-4" />
					</div>
				</motion.article>
				<motion.article
					{...reveal}
					whileHover={{ y: -5 }}
					className="relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-luminous md:col-span-2"
				>
					<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
						{t("invoicing.label")}
					</p>
					<div className="mt-3 flex items-end justify-between">
						<div>
							<p className="text-3xl font-bold">{t("invoicing.amount")}</p>
							<p className="text-xs text-muted-foreground">
								{t("invoicing.caption")}
							</p>
						</div>
						<span className="text-xs text-chart-2">
							{t("invoicing.growth")}
						</span>
					</div>
					<svg
						viewBox="0 0 300 90"
						className="mt-5 w-full text-primary"
						fill="none"
						aria-label={t("invoicing.chartLabel")}
						role="img"
					>
						<motion.path
							initial={{ pathLength: 0 }}
							whileInView={{ pathLength: 1 }}
							transition={{ duration: 1.4 }}
							d="M0 75 C30 72, 45 34, 78 49 S122 76, 151 39 S194 60, 225 25 S268 31,300 5"
							stroke="currentColor"
							strokeWidth="3"
						/>
						<path
							d="M0 75 C30 72, 45 34, 78 49 S122 76, 151 39 S194 60, 225 25 S268 31,300 5 V90 H0Z"
							fill="currentColor"
							opacity=".08"
						/>
					</svg>
				</motion.article>
			</div>
		</section>
	);
}
