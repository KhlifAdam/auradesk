import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import type { SiteBlock } from "@/services/public-site/types";
import { SectionFrame, type SiteVariant } from "./section-frame";

type FaqBlock = Extract<SiteBlock, { kind: "faq" }>;

/** Questions and answers, each opening in place (no script needed). */
export async function FaqSection({
	block,
	locale,
	variant,
}: {
	block: FaqBlock;
	locale: Locale;
	variant: SiteVariant;
}) {
	const t = await getTranslations({
		locale,
		namespace: "PublicSite.sections.faq",
	});

	return (
		<SectionFrame
			id="faq"
			variant={variant}
			eyebrow={t("eyebrow")}
			title={block.title || t("title")}
			subtitle={variant === "minimal" ? undefined : t("subtitle")}
		>
			<div
				className={cn(
					"site-border w-full divide-y border-y [&>*]:site-border",
					variant === "minimal" && "mx-auto max-w-3xl",
				)}
			>
				{block.items.map((item, index) => (
					<details
						// biome-ignore lint/suspicious/noArrayIndexKey: entries have no id; the text may repeat.
						key={`${item.question}-${index}`}
						className="group py-6"
						open={index === 0}
					>
						<summary className="flex cursor-pointer list-none items-center justify-between gap-6 [&::-webkit-details-marker]:hidden">
							<span
								className={cn(
									"site-heading text-xl md:text-2xl",
									variant === "bold" && "font-bold uppercase tracking-tight",
								)}
							>
								{item.question}
							</span>
							<Plus className="site-accent-text h-5 w-5 shrink-0 transition-transform duration-300 group-open:rotate-45" />
						</summary>
						<p className="site-muted max-w-3xl whitespace-pre-line pt-4 text-base leading-relaxed">
							{item.answer}
						</p>
					</details>
				))}
			</div>
		</SectionFrame>
	);
}
