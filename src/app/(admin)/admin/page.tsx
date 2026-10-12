import { ExternalLink, Users } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BanButton } from "@/components/admin/ban-button";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListSkeleton } from "@/components/dashboard/shared/list-skeleton";
import {
	StatCards,
	StatCardsSkeleton,
} from "@/components/dashboard/shared/stat-cards";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { UrlSearch } from "@/components/dashboard/shared/url-search";
import { UrlSelectFilter } from "@/components/dashboard/shared/url-select-filter";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getPlatformStats, listUsers } from "@/services/admin/queries";
import {
	type ListUsersParams,
	listUsersSchema,
	ROLE_FILTERS,
} from "@/services/admin/schemas";

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

async function UserList({ params }: { params: ListUsersParams }) {
	const t = await getTranslations("Admin");
	const format = await getFormatter();
	const { adminId } = await requireAdmin();
	const { items, page, pageCount } = await listUsers(params);

	if (items.length === 0)
		return <EmptyState icon={Users} title={t("users.empty")} />;

	return (
		<div className="flex flex-col gap-4">
			<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
				{items.map((user) => (
					<li
						key={user.id}
						className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5"
					>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium">
								{user.name}
								{user.banned && (
									<Badge
										variant="outline"
										className="ml-2 h-5 border-destructive/40 px-1.5 text-[10px] text-destructive"
									>
										{t("users.suspended")}
									</Badge>
								)}
							</p>
							<p className="truncate text-xs text-muted-foreground">
								{user.email || user.phone} ·{" "}
								{t("users.joined", {
									date: format.dateTime(new Date(user.createdAt), {
										dateStyle: "medium",
									}),
								})}
								{user.banReason && ` · ${user.banReason}`}
							</p>
						</div>
						{user.studio && (
							<a
								href={`/s/${user.studio.slug}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
							>
								{user.studio.name}
								{!user.studio.published && ` (${t("users.draft")})`}
								<ExternalLink className="h-3 w-3" />
							</a>
						)}
						<Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
							{t(`roles.${user.role as (typeof ROLE_FILTERS)[number]}`)}
						</Badge>
						{user.id !== adminId && user.role !== "admin" && (
							<BanButton
								userId={user.id}
								name={user.name}
								banned={user.banned}
							/>
						)}
					</li>
				))}
			</ul>
			<UrlPagination page={page} pageCount={pageCount} />
		</div>
	);
}
