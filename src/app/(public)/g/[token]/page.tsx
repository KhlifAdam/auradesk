import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { GalleryCover } from "@/components/client-work/gallery-cover";
import { GalleryDownloads } from "@/components/client-work/gallery-downloads";
import { SharedGallery } from "@/components/shared-gallery/shared-gallery";
import { BRAND_NAME } from "@/lib/brand";
import { getLinkGallery } from "@/services/galleries/queries";
import { galleryViewSchema } from "@/services/galleries/schemas";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("SharedGallery");
	return {
		title: `${t("metaTitle")} | ${BRAND_NAME}`,
		// A private link: never in search results.
		robots: { index: false, follow: false },
		referrer: "no-referrer",
	};
}

interface SharedGalleryPageProps {
	params: Promise<{ token: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** A client's gallery, opened by anyone holding its share link. */
export default async function SharedGalleryPage({
	params,
	searchParams,
}: SharedGalleryPageProps) {
	const t = await getTranslations("SharedGallery");
	const { token } = await params;
	const view = galleryViewSchema.parse(await searchParams);
	// Only the unfiltered view: picks belong to the client.
	const gallery = await getLinkGallery(token, { ...view, filter: "all" });
	if (!gallery) notFound();
	const showCover =
		gallery.page === 1 &&
		gallery.cover.template !== "NONE" &&
		Boolean(gallery.cover.imageUrl);

	return (
		<main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 bg-background px-4 py-8 text-foreground">
			{showCover && (
				<GalleryCover
					cover={gallery.cover}
					title={gallery.title}
					studioName={gallery.studioName}
				/>
			)}
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div className="flex flex-col gap-1">
					{!showCover && gallery.studioName && (
						<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
							{gallery.studioName}
						</p>
					)}
					{!showCover && (
						<h1 className="font-display text-2xl font-bold tracking-tight">
							{gallery.title}
						</h1>
					)}
					{gallery.description && (
						<p className="max-w-3xl whitespace-pre-wrap text-sm text-muted-foreground">
							{gallery.description}
						</p>
					)}
				</div>
				{gallery.originals && gallery.total > 0 && (
					<GalleryDownloads
						galleryId={gallery.id}
						selectedCount={0}
						token={token}
					/>
				)}
			</div>
			{!gallery.originals && gallery.total > 0 && (
				<p className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
					<Lock className="h-3.5 w-3.5 shrink-0" />
					{t("viewOnly")}
				</p>
			)}
			<div id="photos" className="scroll-mt-4">
				<SharedGallery key={gallery.page} gallery={gallery} token={token} />
			</div>
			<p className="mt-auto pt-6 text-center text-[11px] text-muted-foreground">
				{t("footer", { brand: BRAND_NAME })}
			</p>
		</main>
	);
}
