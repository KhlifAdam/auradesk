import { FolderKanban, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ProjectTable } from "@/components/dashboard/projects/project-table";
import { StageFilter } from "@/components/dashboard/projects/stage-filter";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListSkeleton } from "@/components/dashboard/shared/list-skeleton";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { UrlSearch } from "@/components/dashboard/shared/url-search";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { advanceShootDays } from "@/services/projects/auto-stage";
import { listProjects } from "@/services/projects/queries";
import {
	type ListProjectsParams,
	listProjectsSchema,
} from "@/services/projects/schemas";

interface ProjectsPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProjectsPage({
	searchParams,
}: ProjectsPageProps) {
	const t = await getTranslations("Projects");
	const params = listProjectsSchema.parse(await searchParams);

	return (
		<PageShell>
			<PageHeader
				title={t("title")}
				description={t("description")}
				actions={
					<Button asChild size="sm" className="h-8 gap-1.5 text-xs">
						<Link href="/dashboard/projects/new">
							<Plus className="h-3.5 w-3.5" />
							{t("list.new")}
						</Link>
					</Button>
				}
			/>
			<div className="flex flex-wrap items-center gap-2">
				<UrlSearch placeholder={t("list.search")} />
				<StageFilter active={params.stage} />
			</div>
			<Suspense
				key={`${params.q}-${params.stage}-${params.page}`}
				fallback={<ListSkeleton />}
			>
				<ProjectList params={params} />
			</Suspense>
		</PageShell>
	);
}

async function ProjectList({ params }: { params: ListProjectsParams }) {
	const t = await getTranslations("Projects.empty");
	const { photographerId } = await requirePhotographer();
	// Shoot days reached since the last daily run show up as Shooting now.
	await advanceShootDays(photographerId);
	const { items, page, pageCount } = await listProjects(photographerId, params);
	const filtered = Boolean(params.q || params.stage);

	if (items.length === 0) {
		return (
			<EmptyState
				icon={FolderKanban}
				title={filtered ? t("noMatch") : t("title")}
				description={filtered ? undefined : t("description")}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<ProjectTable projects={items} />
			<UrlPagination page={page} pageCount={pageCount} />
		</div>
	);
}
