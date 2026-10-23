import { notFound } from "next/navigation";
import { AlbumDetailHeader } from "@/components/dashboard/portfolio/album-detail-header";
import { AlbumItemsGrid } from "@/components/dashboard/portfolio/album-items-grid";
import { AlbumUploader } from "@/components/dashboard/portfolio/album-uploader";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { getAlbum } from "@/services/portfolio/queries";
import { pageParamsSchema } from "@/services/shared/pagination";

export default async function AlbumPage({
	params,
	searchParams,
}: {
	params: Promise<{ albumId: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const { albumId } = await params;
	const { page } = pageParamsSchema.parse(await searchParams);
	const { photographerId } = await requirePhotographer();
	const album = await getAlbum(photographerId, albumId, page);
	if (!album) notFound();

	return (
		<PageShell>
			<AlbumDetailHeader album={album} />
			<AlbumUploader albumId={album.id} empty={album.itemCount === 0} />
			<AlbumItemsGrid album={album} />
		</PageShell>
	);
}
