import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { AuditList } from "@/components/admin/audit-list";
import { SubscriptionCard } from "@/components/admin/subscription-card";
import { UserHeader } from "@/components/admin/user-header";
import { StatCards } from "@/components/dashboard/shared/stat-cards";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ROLES } from "@/lib/auth/roles";
import { formatBytes } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { listAdminActions } from "@/services/admin/audit";
import { getAdminUserDetail } from "@/services/admin/user-detail";
import { getSubscription } from "@/services/billing/queries";

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
	// A deleted studio takes no more payments.
	const subscription =
		isStudio && !user.deleted ? await getSubscription(user.id) : null;

	return (
		<>
			<Link
				href="/admin"
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("detail.back")}
			</Link>
			<UserHeader user={user} adminId={adminId} />
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
			{subscription && (
				<SubscriptionCard userId={user.id} subscription={subscription} />
			)}
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
