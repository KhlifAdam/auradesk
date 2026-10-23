import { getTranslations } from "next-intl/server";
import {
	AlbumList,
	NewAlbumButton,
} from "@/components/dashboard/portfolio/album-list";
import { PortfolioTabs } from "@/components/dashboard/portfolio/portfolio-tabs";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { listAlbums } from "@/services/portfolio/queries";
import { pageParamsSchema } from "@/services/shared/pagination";

export default async function PortfolioPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const t = await getTranslations("Portfolio");
	const { page } = pageParamsSchema.parse(await searchParams);
	const { photographerId } = await requirePhotographer();
	const albums = await listAlbums(photographerId, page);

	return (
		<PageShell>
			<PageHeader
				title={t("title")}
				description={t("description")}
				actions={<NewAlbumButton />}
			/>
			<PortfolioTabs />
			<AlbumList albums={albums} />
		</PageShell>
	);
}
