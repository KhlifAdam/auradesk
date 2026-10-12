import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { GalleryDownloads } from "@/components/client-work/gallery-downloads";
import { GalleryPhotoGrid } from "@/components/dashboard/galleries/gallery-photo-grid";
import { GallerySettingsDialog } from "@/components/dashboard/galleries/gallery-settings-dialog";
import { GalleryToolbar } from "@/components/dashboard/galleries/gallery-toolbar";
import { GalleryUploader } from "@/components/dashboard/galleries/gallery-uploader";
import { OrganizeDialog } from "@/components/dashboard/galleries/organize-dialog";
import { PhotoAssistant } from "@/components/dashboard/galleries/photo-assistant";
import { VideoAssistant } from "@/components/dashboard/galleries/video-assistant";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { getGalleryInsights } from "@/services/ai/photo-queries";
import { getVideoInsights } from "@/services/ai/video-queries";
import { getOrganizeSummary } from "@/services/galleries/organize-queries";
import { getOwnedGallery } from "@/services/galleries/queries";
import { galleryViewSchema } from "@/services/galleries/schemas";

interface GalleryPageProps {
	params: Promise<{ projectId: string; galleryId: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GalleryManagerPage({
	params,
	searchParams,
}: GalleryPageProps) {
	const t = await getTranslations("Galleries.manager");
	const { projectId, galleryId } = await params;
	const view = galleryViewSchema.parse(await searchParams);
	const { photographerId } = await requirePhotographer();
	const gallery = await getOwnedGallery(photographerId, galleryId, view);
	if (!gallery || gallery.projectId !== projectId) notFound();
	const [insights, videoInsights, organize] = await Promise.all([
		getGalleryInsights(photographerId, gallery.id),
		getVideoInsights(
			photographerId,
			gallery.id,
			gallery.items
				.filter((item) => item.type === "VIDEO")
				.map((item) => item.id),
		),
		getOrganizeSummary(photographerId, gallery.id, gallery.projectTitle),
	]);

	return (
		<PageShell>
			<Link
				href={`/dashboard/projects/${projectId}`}
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{gallery.projectTitle}
			</Link>
			<PageHeader
				title={gallery.title}
				description={gallery.description || t("description")}
				actions={
					<>
						{gallery.total > 0 && (
							<GalleryDownloads
								galleryId={gallery.id}
								selectedCount={gallery.selectedCount}
							/>
						)}
						{gallery.total > 0 && (
							<OrganizeDialog galleryId={gallery.id} summary={organize} />
						)}
						<GallerySettingsDialog gallery={gallery} />
					</>
				}
			/>
			<GalleryToolbar gallery={gallery} />
			<PhotoAssistant galleryId={gallery.id} insights={insights} />
			<VideoAssistant galleryId={gallery.id} insights={videoInsights} />
			<GalleryUploader galleryId={gallery.id} />
			<GalleryPhotoGrid
				key={`${gallery.filter}-${gallery.page}`}
				gallery={gallery}
			/>
		</PageShell>
	);
}
