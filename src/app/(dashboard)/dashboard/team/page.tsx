import { UsersRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListSkeleton } from "@/components/dashboard/shared/list-skeleton";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import {
	StatCards,
	StatCardsSkeleton,
} from "@/components/dashboard/shared/stat-cards";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { UrlSearch } from "@/components/dashboard/shared/url-search";
import { InviteMemberDialog } from "@/components/dashboard/team/invite-member-dialog";
import { MemberList } from "@/components/dashboard/team/member-list";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { getTeamStats, listTeamMembers } from "@/services/team/queries";
import { type ListTeamParams, listTeamSchema } from "@/services/team/schemas";

interface TeamPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TeamPage({ searchParams }: TeamPageProps) {
	const t = await getTranslations("Team");
	const params = listTeamSchema.parse(await searchParams);

	return (
		<PageShell>
			<PageHeader
				title={t("title")}
				description={t("description")}
				actions={<InviteMemberDialog />}
			/>
			<Suspense fallback={<StatCardsSkeleton count={3} />}>
				<Stats />
			</Suspense>
			<UrlSearch placeholder={t("list.search")} />
			<Suspense key={`${params.q}-${params.page}`} fallback={<ListSkeleton />}>
				<Members params={params} />
			</Suspense>
		</PageShell>
	);
}

async function Stats() {
	const t = await getTranslations("Team.stats");
	const { photographerId } = await requirePhotographer();
	const stats = await getTeamStats(photographerId);
	return (
		<StatCards
			items={[
				{ label: t("total"), value: stats.total },
				{ label: t("active"), value: stats.active, tone: "text-success" },
				{ label: t("pending"), value: stats.pending, tone: "text-primary" },
			]}
		/>
	);
}

async function Members({ params }: { params: ListTeamParams }) {
	const t = await getTranslations("Team.empty");
	const { photographerId } = await requirePhotographer();
	const { items, page, pageCount } = await listTeamMembers(
		photographerId,
		params,
	);

	if (items.length === 0) {
		return (
			<EmptyState
				icon={UsersRound}
				title={params.q ? t("noMatch") : t("title")}
				description={params.q ? undefined : t("description")}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<MemberList members={items} />
			<UrlPagination page={page} pageCount={pageCount} />
		</div>
	);
}
