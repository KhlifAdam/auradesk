import { ArrowLeft, Camera } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { PortalProjectsSkeleton } from "@/components/portal/portal-skeletons";
import { StudioCard } from "@/components/portal/studios/studio-card";
import { requireClient } from "@/lib/auth/require-client";
import { listPortalStudios } from "@/services/portal/studio-queries";
import { pageParamsSchema } from "@/services/shared/pagination";

interface PortalStudiosPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Every photographer the client is in contact with, apart from the rest. */
export default async function PortalStudiosPage({
	searchParams,
}: PortalStudiosPageProps) {
	const t = await getTranslations("Portal.studios");
	const { page } = pageParamsSchema.parse(await searchParams);

	return (
		<>
			<div className="flex flex-col gap-1">
				<Link
					href="/portal"
					className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					{t("back")}
				</Link>
				<h1 className="font-display text-2xl font-bold tracking-tight">
					{t("title")}
				</h1>
				<p className="text-sm text-muted-foreground">{t("description")}</p>
			</div>
			<Suspense key={page} fallback={<PortalProjectsSkeleton />}>
				<StudioList page={page} />
			</Suspense>
		</>
	);
}

async function StudioList({ page }: { page: number }) {
	const t = await getTranslations("Portal.studios");
	const { session } = await requireClient();
	const studios = await listPortalStudios(session.user, page);

	if (studios.total === 0)
		return (
			<EmptyState
				icon={Camera}
				title={t("empty.title")}
				description={t("empty.description")}
			/>
		);

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{studios.items.map((studio) => (
					<StudioCard key={studio.photographerId} studio={studio} />
				))}
			</div>
			<UrlPagination page={studios.page} pageCount={studios.pageCount} />
		</div>
	);
}
