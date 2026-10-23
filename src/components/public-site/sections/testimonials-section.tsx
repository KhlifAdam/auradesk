import { Quote } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { initialsOf } from "@/lib/initials";
import { cn } from "@/lib/utils";
import type { SiteBlock } from "@/services/public-site/types";
import { Reveal } from "../shared/reveal";
import { SectionFrame, type SiteVariant } from "./section-frame";

type TestimonialsBlock = Extract<SiteBlock, { kind: "testimonials" }>;

const QUOTE: Record<SiteVariant, string> = {
	minimal: "text-lg leading-relaxed",
	editorial: "site-heading text-2xl italic leading-snug",
	bold: "text-lg font-medium leading-relaxed",
};

/** What clients say, as quote cards with the author's name and photo. */
export async function TestimonialsSection({
	block,
	locale,
	variant,
}: {
	block: TestimonialsBlock;
	locale: Locale;
	variant: SiteVariant;
}) {
	const t = await getTranslations({
		locale,
		namespace: "PublicSite.sections.testimonials",
	});

	return (
		<SectionFrame
			id="testimonials"
			variant={variant}
			eyebrow={t("eyebrow")}
			title={block.title || t("title")}
		>
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{block.items.map((item, index) => (
					<Reveal
						// biome-ignore lint/suspicious/noArrayIndexKey: entries have no id; the text may repeat.
						key={`${item.author}-${index}`}
						delay={(index % 3) * 0.08}
						className={cn(
							"site-card site-border flex h-full flex-col gap-6 border p-8",
							variant === "minimal" && "rounded-2xl",
							variant === "bold" && "border-l-4 site-accent-border",
						)}
					>
						<figure className="flex h-full flex-col gap-6">
							<Quote className="site-accent-text h-7 w-7" />
							<blockquote
								className={cn("flex-1 whitespace-pre-line", QUOTE[variant])}
							>
								{item.quote}
							</blockquote>
							<figcaption className="flex items-center gap-3">
								<div className="site-border relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-semibold">
									{item.photo ? (
										<Image
											src={item.photo.url}
											alt={item.photo.alt || item.author}
											fill
											sizes="44px"
											className="object-cover"
										/>
									) : (
										initialsOf(item.author)
									)}
								</div>
								<div className="flex flex-col">
									<span
										className={cn(
											"text-sm font-semibold",
											variant === "bold" && "uppercase tracking-wider",
										)}
									>
										{item.author}
									</span>
									{item.role && (
										<span className="site-muted text-xs">{item.role}</span>
									)}
								</div>
							</figcaption>
						</figure>
					</Reveal>
				))}
			</div>
		</SectionFrame>
	);
}
