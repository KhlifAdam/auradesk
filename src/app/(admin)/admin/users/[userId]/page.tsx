import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { AuditList } from "@/components/admin/audit-list";
import { BanButton } from "@/components/admin/ban-button";
import { StatCards } from "@/components/dashboard/shared/stat-cards";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ROLES } from "@/lib/auth/roles";
import { formatBytes } from "@/lib/format";
import { initialsOf } from "@/lib/initials";
import { formatPhone } from "@/lib/phone";
import { listAdminActions } from "@/services/admin/audit";
import type { ROLE_FILTERS } from "@/services/admin/schemas";
import { getAdminUserDetail } from "@/services/admin/user-detail";

/**
 * One account for the admin: identity, activity, studio, and how much it
 * holds, as counts. Never its clients, projects, files or money.
 */
export default async function AdminUserPage({
	params,
}: {
	params: Promise<{ userId: string }>;
}) {
	const t = await getTranslations("Admin");
	const format = await getFormatter();
	const locale = await getLocale();
	const { adminId } = await requireAdmin();
	const { userId } = await params;
	const [user, history] = await Promise.all([
		getAdminUserDetail(userId),
		listAdminActions(1, userId),
	]);
	if (!user) notFound();

	const date = (iso: string) =>
		format.dateTime(new Date(iso), { dateStyle: "medium" });
	const facts = [
		{ label: t("detail.joined"), value: date(user.createdAt) },
		{
			label: t("detail.lastActive"),
			value: user.lastActiveAt
				? format.relativeTime(new Date(user.lastActiveAt), new Date())
				: t("detail.never"),
		},
		{ label: t("detail.email"), value: user.email || "—" },
		{
			label: t("detail.phone"),
			value: user.phone ? formatPhone(user.phone) : "—",
		},
	];
	const isStudio = user.role === ROLES.photographer;

	return (
		<>
			<Link
				href="/admin"
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("detail.back")}
			</Link>
			<div className="flex flex-wrap items-center gap-3">
				<Avatar className="h-12 w-12 border border-border">
					<AvatarImage
						src={user.image ?? undefined}
						alt=""
						className="object-cover"
					/>
					<AvatarFallback className="bg-primary/10 text-primary">
						{initialsOf(user.name)}
					</AvatarFallback>
				</Avatar>
				<div className="flex flex-1 flex-col gap-0.5">
					<h1 className="flex flex-wrap items-center gap-2 font-display text-xl font-bold tracking-tight">
						{user.name}
						<Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
							{t(`roles.${user.role as (typeof ROLE_FILTERS)[number]}`)}
						</Badge>
						{user.banned && (
							<Badge
								variant="outline"
								className="h-5 border-destructive/40 px-1.5 text-[10px] text-destructive"
							>
								{t("users.suspended")}
							</Badge>
						)}
					</h1>
					{user.banReason && (
						<p className="text-xs text-muted-foreground">
							{t("activity.reason", { reason: user.banReason })}
						</p>
					)}
				</div>
				{user.id !== adminId && user.role !== ROLES.admin && (
					<BanButton userId={user.id} name={user.name} banned={user.banned} />
				)}
			</div>
			<dl className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
				{facts.map((fact) => (
					<div key={fact.label} className="min-w-0">
						<dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
							{fact.label}
						</dt>
						<dd className="truncate text-sm">{fact.value}</dd>
					</div>
				))}
			</dl>
			{isStudio && (
				<section className="flex flex-col gap-3">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<h2 className="text-sm font-semibold">{t("detail.studio")}</h2>
						{user.studio ? (
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
						) : (
							<span className="text-xs text-muted-foreground">
								{t("detail.noStudio")}
							</span>
						)}
					</div>
					<StatCards
						items={[
							{ label: t("detail.counts.clients"), value: user.counts.clients },
							{
								label: t("detail.counts.projects"),
								value: user.counts.projects,
							},
							{
								label: t("detail.counts.galleries"),
								value: user.counts.galleries,
							},
							{ label: t("detail.counts.photos"), value: user.counts.photos },
							{
								label: t("detail.counts.bookings"),
								value: user.counts.bookings,
							},
							{
								label: t("detail.counts.invoices"),
								value: user.counts.invoices,
							},
							{
								label: t("detail.storage"),
								value: formatBytes(user.storageBytes, locale),
								tone: "text-primary",
							},
						]}
					/>
					<p className="text-[11px] text-muted-foreground">
						{t("detail.privacy")}
					</p>
				</section>
			)}
			<section className="flex flex-col gap-3">
				<h2 className="text-sm font-semibold">{t("detail.history")}</h2>
				<AuditList log={history} />
			</section>
		</>
	);
}
