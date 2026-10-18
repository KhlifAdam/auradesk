import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SignupChart } from "@/components/admin/signup-chart";
import { StorageCard } from "@/components/admin/storage-card";
import { UserList } from "@/components/admin/user-list";
import { ListSkeleton } from "@/components/dashboard/shared/list-skeleton";
import {
	StatCards,
	StatCardsSkeleton,
} from "@/components/dashboard/shared/stat-cards";
import { UrlSearch } from "@/components/dashboard/shared/url-search";
import { UrlSelectFilter } from "@/components/dashboard/shared/url-select-filter";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSignupSeries, getStorageOverview } from "@/services/admin/insights";
import { getPlatformStats } from "@/services/admin/queries";
import { listUsersSchema, ROLE_FILTERS } from "@/services/admin/schemas";

interface AdminPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Platform overview and account management, without any studio's private data. */
export default async function AdminPage({ searchParams }: AdminPageProps) {
	const t = await getTranslations("Admin");
	const params = listUsersSchema.parse(await searchParams);

	return (
		<>
			<div className="flex flex-col gap-0.5">
				<h1 className="font-display text-xl font-bold tracking-tight">
					{t("title")}
				</h1>
				<p className="text-xs text-muted-foreground">{t("description")}</p>
			</div>
			<Suspense fallback={<StatCardsSkeleton count={6} />}>
				<Stats />
			</Suspense>
			<Suspense
				fallback={
					<div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
				}
			>
				<Insights />
			</Suspense>
			<div className="flex flex-wrap items-center gap-2">
				<UrlSearch placeholder={t("users.search")} />
				<UrlSelectFilter
					param="role"
					active={params.role}
					allLabel={t("users.allRoles")}
					ariaLabel={t("users.role")}
					options={ROLE_FILTERS.map((value) => ({
						value,
						label: t(`roles.${value}`),
					}))}
				/>
			</div>
			<Suspense
				key={`${params.q}-${params.role}-${params.page}`}
				fallback={<ListSkeleton />}
			>
				<UserList params={params} />
			</Suspense>
		</>
	);
}

async function Stats() {
	const t = await getTranslations("Admin.stats");
	await requireAdmin();
	const stats = await getPlatformStats();
	return (
		<StatCards
			items={[
				{ label: t("photographers"), value: stats.photographers },
				{ label: t("clients"), value: stats.clients },
				{ label: t("collaborators"), value: stats.collaborators },
				{
					label: t("publishedSites"),
					value: stats.publishedSites,
					tone: "text-success",
				},
				{
					label: t("newThisMonth"),
					value: stats.newThisMonth,
					tone: "text-primary",
				},
				{ label: t("banned"), value: stats.banned, tone: "text-destructive" },
			]}
		/>
	);
}

/** Sign-ups over the year, and what the platform stores. */
async function Insights() {
	await requireAdmin();
	const [series, storage] = await Promise.all([
		getSignupSeries(),
		getStorageOverview(),
	]);
	return (
		<div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
			<SignupChart series={series} />
			<StorageCard storage={storage} />
		</div>
	);
}
