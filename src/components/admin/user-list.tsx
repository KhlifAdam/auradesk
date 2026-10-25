import { ExternalLink, Users } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { Badge } from "@/components/ui/badge";
import { isMainAdminEmail } from "@/lib/auth/main-admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listUsers } from "@/services/admin/queries";
import type { ListUsersParams, ROLE_FILTERS } from "@/services/admin/schemas";
import { BanButton } from "./ban-button";

/** Every account, searchable; each opens its page in the admin. */
export async function UserList({ params }: { params: ListUsersParams }) {
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
								<Link
									href={`/admin/users/${user.id}`}
									className="hover:text-primary hover:underline"
								>
									{user.name}
								</Link>
								{isMainAdminEmail(user.email) && (
									<Badge className="ml-2 h-5 px-1.5 text-[10px]">
										{t("mainAdmin")}
									</Badge>
								)}
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
