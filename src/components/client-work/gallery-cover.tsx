import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { GalleryCoverData } from "@/services/galleries/types";

interface GalleryCoverProps {
	cover: GalleryCoverData;
	title: string;
	studioName: string | null;
	/** Drawn small (editor preview, gallery cards): no scroll link, shorter. */
	preview?: boolean;
	/** A small copy that is still above the fold (the first gallery cards). */
	eager?: boolean;
}

/**
 * The cover page at the top of a gallery, in the photographer's chosen
 * layout. One renderer for the editor's preview, the client's gallery and
 * the share link, so the preview always matches. Sizes follow the
 * container, not the screen, so the preview lays out like a phone would.
 */
export function GalleryCover({
	cover,
	title,
	studioName,
	preview,
	eager,
}: GalleryCoverProps) {
	const t = useTranslations("Galleries.cover");
	const format = useFormatter();
	if (cover.template === "NONE" || !cover.imageUrl) return null;

	const date = cover.date
		? format.dateTime(new Date(cover.date), {
				dateStyle: "long",
				timeZone: "UTC",
			})
		: null;
	const photo = (
		<Image
			src={cover.imageUrl}
			alt={title}
			fill
			unoptimized
			loading={preview && !eager ? "lazy" : "eager"}
			className="object-cover"
			style={{
				objectPosition: `${cover.focalX * 100}% ${cover.focalY * 100}%`,
			}}
		/>
	);
	const scrollTo = (className: string) =>
		!preview && (
			<a
				href="#photos"
				className={cn(
					"mt-2 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300",
					className,
				)}
			>
				{t("view")}
				<ChevronDown className="h-3.5 w-3.5" />
			</a>
		);
	const eyebrow = (className?: string) =>
		studioName && (
			<p
				className={cn(
					"text-[11px] font-medium uppercase tracking-[0.3em]",
					className,
				)}
			>
				{studioName}
			</p>
		);
	// Small copies sit inside pages that have their own main title.
	const Heading = preview ? "h2" : "h1";
	const heading = (className?: string): ReactNode => (
		<Heading
			className={cn(
				"font-display font-semibold tracking-tight",
				preview ? "text-2xl" : "text-4xl @2xl:text-6xl",
				className,
			)}
		>
			{title}
		</Heading>
	);

	if (cover.template === "SPLIT")
		return (
			<section className="@container overflow-hidden rounded-2xl border border-border bg-card">
				<div className="grid @2xl:grid-cols-2">
					<div
						className={cn(
							"relative aspect-[4/3] @2xl:order-last @2xl:aspect-auto",
							preview ? "@2xl:min-h-56" : "@2xl:min-h-[520px]",
						)}
					>
						{photo}
					</div>
					<div className="flex flex-col justify-center gap-3 p-6 @2xl:p-12">
						{eyebrow("text-muted-foreground")}
						{heading()}
						<span className="h-px w-12 bg-primary" />
						{date && <p className="text-sm text-muted-foreground">{date}</p>}
						{scrollTo("bg-primary text-primary-foreground hover:opacity-90")}
					</div>
				</div>
			</section>
		);

	if (cover.template === "FRAME")
		return (
			<section className="@container flex flex-col items-center gap-5 rounded-2xl border border-border bg-card px-4 py-8 text-center @2xl:px-10 @2xl:py-12">
				{eyebrow("text-muted-foreground")}
				<div className="relative aspect-[3/2] w-full max-w-4xl overflow-hidden rounded-md shadow-luminous-lg ring-1 ring-border">
					{photo}
				</div>
				{heading()}
				{date && <p className="text-sm text-muted-foreground">{date}</p>}
				{scrollTo("border border-border hover:border-primary/50")}
			</section>
		);

	return (
		<section
			className={cn(
				"@container relative isolate flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl px-6 text-center text-white",
				preview ? "aspect-[16/9]" : "h-[min(75vh,720px)] min-h-[380px]",
			)}
		>
			{photo}
			<div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/60" />
			{/* A soft shade right behind the text, so it reads on busy photos. */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.38),transparent_65%)]" />
			<div className="relative flex flex-col items-center gap-3">
				{eyebrow("text-white/80")}
				{heading("drop-shadow-sm")}
				{date && <p className="text-sm text-white/85">{date}</p>}
				{scrollTo("border border-white/40 backdrop-blur hover:bg-white/10")}
			</div>
		</section>
	);
}
