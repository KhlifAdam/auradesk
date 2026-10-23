import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import type { SiteBlock } from "@/services/public-site/types";
import { SectionFrame, type SiteVariant } from "./section-frame";

type ClientsBlock = Extract<SiteBlock, { kind: "clients" }>;
type Logo = ClientsBlock["items"][number];

/** Fewer logos than this are repeated, so the strip never shows a gap. */
const MIN_PER_LOOP = 8;
const SECONDS_PER_LOGO = 4;

function LogoTile({ item }: { item: Logo }) {
	const image = (
		<Image
			src={item.logo.url}
			alt={item.name}
			width={item.logo.width}
			height={item.logo.height}
			sizes="160px"
			unoptimized={item.logo.url.endsWith(".svg")}
			// Grey and quiet until hovered, so different brands sit together.
			className="h-9 w-auto max-w-36 object-contain opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 md:h-11"
		/>
	);
	return item.url ? (
		<a
			href={item.url}
			target="_blank"
			rel="noopener noreferrer"
			title={item.name}
		>
			{image}
		</a>
	) : (
		image
	);
}

/** "They trust me": client logos scrolling endlessly, paused on hover. */
export async function ClientsSection({
	block,
	locale,
	variant,
}: {
	block: ClientsBlock;
	locale: Locale;
	variant: SiteVariant;
}) {
	const t = await getTranslations({
		locale,
		namespace: "PublicSite.sections.clients",
	});
	const repeat = Math.ceil(MIN_PER_LOOP / block.items.length);
	const loop = Array.from({ length: repeat }, () => block.items).flat();

	return (
		<SectionFrame
			id="clients"
			variant={variant}
			eyebrow={t("eyebrow")}
			title={block.title || t("title")}
			className="md:py-24"
		>
			<div className="site-marquee-mask overflow-hidden">
				<div
					className="site-marquee flex w-max items-center"
					style={
						{
							"--marquee-duration": `${loop.length * SECONDS_PER_LOGO}s`,
						} as React.CSSProperties
					}
				>
					{[0, 1].map((copy) => (
						<ul
							key={copy}
							aria-hidden={copy === 1 || undefined}
							className="flex shrink-0 items-center gap-16 pr-16 md:gap-24 md:pr-24"
						>
							{loop.map((item, index) => (
								<li
									// biome-ignore lint/suspicious/noArrayIndexKey: the same logo repeats in the loop.
									key={`${item.logo.id}-${index}`}
									className="shrink-0"
								>
									<LogoTile item={item} />
								</li>
							))}
						</ul>
					))}
				</div>
			</div>
		</SectionFrame>
	);
}
