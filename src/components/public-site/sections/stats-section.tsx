import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import type { SiteBlock } from "@/services/public-site/types";
import { Reveal } from "../shared/reveal";
import { SectionFrame, type SiteVariant } from "./section-frame";

type StatsBlock = Extract<SiteBlock, { kind: "stats" }>;

const VALUE: Record<SiteVariant, string> = {
	minimal: "text-5xl md:text-6xl",
	editorial: "text-6xl italic md:text-7xl",
	bold: "text-6xl font-bold tracking-tighter md:text-8xl",
};

/** Key figures: weddings shot, years of work, countries… */
export async function StatsSection({
	block,
	locale,
	variant,
}: {
	block: StatsBlock;
	locale: Locale;
	variant: SiteVariant;
}) {
	const t = await getTranslations({
		locale,
		namespace: "PublicSite.sections.stats",
	});

	return (
		<SectionFrame
			id="stats"
			variant={variant}
			eyebrow={t("eyebrow")}
			title={block.title || t("title")}
		>
			<dl
				className={cn(
					"grid grid-cols-2 gap-x-8 gap-y-12",
					block.items.length >= 4 && "md:grid-cols-4",
					block.items.length === 3 && "md:grid-cols-3",
				)}
			>
				{block.items.map((item, index) => (
					<Reveal
						// biome-ignore lint/suspicious/noArrayIndexKey: entries have no id; the text may repeat.
						key={`${item.label}-${index}`}
						delay={index * 0.08}
						className={cn(
							"flex flex-col gap-2",
							variant === "minimal" && "items-center text-center",
							variant === "bold" && "site-border border-t pt-6",
						)}
					>
						<dd className={cn("site-heading site-accent-text", VALUE[variant])}>
							{item.value}
						</dd>
						<dt
							className={cn(
								"site-muted text-sm",
								variant !== "editorial" && "uppercase tracking-[0.2em]",
							)}
						>
							{item.label}
						</dt>
					</Reveal>
				))}
			</dl>
		</SectionFrame>
	);
}
