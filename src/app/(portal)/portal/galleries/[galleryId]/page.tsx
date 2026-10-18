import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { GalleryCover } from "@/components/client-work/gallery-cover";
import { GalleryDownloads } from "@/components/client-work/gallery-downloads";
import { PortalGallery } from "@/components/portal/portal-gallery";
import { ShareLinkDialog } from "@/components/portal/share-link-dialog";
import { requireClient } from "@/lib/auth/require-client";
import {
	findHiddenGalleryProject,
	getClientGallery,
} from "@/services/galleries/queries";
import { galleryViewSchema } from "@/services/galleries/schemas";

interface PortalGalleryPageProps {
	params: Promise<{ galleryId: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PortalGalleryPage({
	params,
	searchParams,
}: PortalGalleryPageProps) {
	const t = await getTranslations("Portal.gallery");
	const { galleryId } = await params;
	const view = galleryViewSchema.parse(await searchParams);
	const { clientId } = await requireClient();
	const gallery = await getClientGallery(clientId, galleryId, view);
	if (!gallery) {
		// Made private by the photographer: back to the project, with a word.
		const projectId = await findHiddenGalleryProject(clientId, galleryId);
		if (!projectId) notFound();
		redirect(`/portal/projects/${projectId}?notice=galleryHidden`);
	}

	const limit = gallery.selectionLimit;
	const hint = !gallery.selectionEnabled
		? null
		: gallery.submitted
			? t("hintSubmitted")
			: limit
				? t("hintLimit", { limit })
				: t("hint");

	// The cover opens the gallery: first page of all photos only.
	const showCover =
		gallery.page === 1 &&
		gallery.filter === "all" &&
		gallery.cover.template !== "NONE" &&
		Boolean(gallery.cover.imageUrl);

	return (
		<>
			<Link
				href={`/portal/projects/${gallery.projectId}`}
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{gallery.projectTitle}
			</Link>
			{showCover && (
				<GalleryCover
					cover={gallery.cover}
					title={gallery.title}
					studioName={gallery.studioName}
				/>
			)}
			<div className="flex flex-col gap-1">
				<div className="flex flex-wrap items-center justify-between gap-2">
					{showCover ? (
						<span />
					) : (
						<h1 className="font-display text-2xl font-bold tracking-tight">
							{gallery.title}
						</h1>
					)}
					{gallery.linkSharing && (
						<ShareLinkDialog
							galleryId={gallery.id}
							share={gallery.share}
							downloadsPossible={gallery.originals}
						/>
					)}
				</div>
				{gallery.description && (
					<p className="max-w-3xl whitespace-pre-wrap text-sm text-muted-foreground">
						{gallery.description}
					</p>
				)}
				{hint && <p className="text-xs text-muted-foreground">{hint}</p>}
			</div>
			{!gallery.originals && gallery.total > 0 && (
				<p className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
					<Lock className="h-3.5 w-3.5 shrink-0" />
					{t(gallery.kind === "PROOFS" ? "proofsOnly" : "previewsOnly")}
				</p>
			)}
			{gallery.originals && gallery.total > 0 && (
				<GalleryDownloads
					galleryId={gallery.id}
					selectedCount={gallery.selectedCount}
				/>
			)}
			<div id="photos" className="scroll-mt-4">
				<PortalGallery
					key={`${gallery.filter}-${gallery.page}`}
					gallery={gallery}
				/>
			</div>
		</>
	);
}
