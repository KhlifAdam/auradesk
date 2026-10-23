import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import type { SiteBlock } from "@/services/public-site/types";
import { Reveal } from "../shared/reveal";
import { SectionFrame, type SiteVariant } from "./section-frame";

type ShowreelBlock = Extract<SiteBlock, { kind: "showreel" }>;

/** One full-width film: a library video, or a YouTube / Vimeo player. */
export async function ShowreelSection({
	block,
	locale,
	variant,
}: {
	block: ShowreelBlock;
	locale: Locale;
	variant: SiteVariant;
}) {
	const t = await getTranslations({
		locale,
		namespace: "PublicSite.sections.showreel",
	});
	const title = block.title || t("title");

	return (
		<SectionFrame
			id="showreel"
			variant={variant}
			eyebrow={t("eyebrow")}
			title={title}
		>
			<Reveal
				className={cn(
					"site-card relative aspect-video w-full overflow-hidden",
					variant === "minimal" && "rounded-2xl",
				)}
			>
				{block.video ? (
					<video
						src={block.video.url}
						controls
						playsInline
						preload="metadata"
						className="h-full w-full bg-black object-contain"
					>
						<track kind="captions" />
					</video>
				) : (
					block.embedUrl && (
						<iframe
							src={block.embedUrl}
							title={title}
							loading="lazy"
							allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
							allowFullScreen
							className="absolute inset-0 h-full w-full border-0"
						/>
					)
				)}
			</Reveal>
		</SectionFrame>
	);
}
