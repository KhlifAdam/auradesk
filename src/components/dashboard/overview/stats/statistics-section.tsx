import {
	CalendarCheck,
	Camera,
	CircleCheck,
	FolderKanban,
	FolderPlus,
	HardDrive,
	Inbox,
	MessageSquare,
	UserPlus,
	Users,
	Wallet,
	WalletCards,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { formatBytes } from "@/lib/format";
import { BOOKING_STATUSES } from "@/services/bookings/options";
import type { Period } from "@/services/overview/period";
import { getOverviewStats } from "@/services/overview/stats";
import { formatMoney } from "@/services/projects/money";
import { PROJECT_STAGES } from "@/services/projects/stages";
import { ActivityChart } from "./activity-chart";
import { BreakdownCard } from "./breakdown-card";
import { KpiCard } from "./kpi-card";
import { UpcomingShoots } from "./upcoming-shoots";

const STATUS_BAR: Record<(typeof BOOKING_STATUSES)[number], string> = {
	NEW: "bg-primary",
	DISCUSSION: "bg-event-meeting",
	QUOTE_SENT: "bg-event-other",
	CONFIRMED: "bg-success",
	DECLINED: "bg-destructive",
};

/** One color per phase: planning, shoot, editing, client review, delivered. */
const STAGE_BAR: Record<(typeof PROJECT_STAGES)[number], string> = {
	BOOKING: "bg-event-meeting",
	PREP: "bg-event-meeting",
	SHOOTING: "bg-event-shoot",
	IMPORT: "bg-event-other",
	ORGANIZATION: "bg-event-other",
	SELECTION: "bg-event-other",
	POST_PRODUCTION: "bg-event-other",
	EXPORT: "bg-event-other",
	VALIDATION: "bg-event-project",
	DELIVERY: "bg-success",
};

/** All the numbers for the chosen period, streamed in below the filter. */
export async function StatisticsSection({
	period,
	timeZone,
}: {
	period: Period;
	timeZone: string;
}) {
	const t = await getTranslations("Dashboard.Overview.statistics");
	const tStatus = await getTranslations("Bookings.status");
	const tStage = await getTranslations("Projects.stages");
	const locale = await getLocale();
	const { photographerId } = await requirePhotographer();
	const stats = await getOverviewStats(photographerId, period, timeZone);

	const versus = period.previous ? t("vsPrevious") : undefined;
	const number = (value: number) => value.toLocaleString(locale);
	const activeProjects = PROJECT_STAGES.filter((s) => s !== "DELIVERY").reduce(
		(sum, stage) => sum + (stats.projects.byStage[stage] ?? 0),
		0,
	);

	return (
		<div className="flex flex-col gap-3">
			<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
				<KpiCard
					label={t("kpi.newBookings")}
					icon={Inbox}
					tone="gold"
					value={number(stats.bookings.created.value)}
					compared={stats.bookings.created}
					versus={versus}
					href="/dashboard/bookings"
				/>
				<KpiCard
					label={t("kpi.confirmedBookings")}
					icon={CalendarCheck}
					tone="green"
					value={number(stats.bookings.confirmed.value)}
					compared={stats.bookings.confirmed}
					versus={versus}
					href="/dashboard/bookings?status=CONFIRMED"
				/>
				<KpiCard
					label={t("kpi.newClients")}
					icon={UserPlus}
					tone="blue"
					value={number(stats.clients.new.value)}
					compared={stats.clients.new}
					versus={versus}
					href="/dashboard/clients"
				/>
				<KpiCard
					label={t("kpi.unread")}
					icon={MessageSquare}
					tone="red"
					value={number(stats.unread)}
					hint={t("hint.now")}
					href="/dashboard/messages"
				/>
				<KpiCard
					label={t("kpi.newProjects")}
					icon={FolderPlus}
					tone="purple"
					value={number(stats.projects.created.value)}
					compared={stats.projects.created}
					versus={versus}
					href="/dashboard/projects"
				/>
				<KpiCard
					label={t("kpi.deliveredProjects")}
					icon={CircleCheck}
					tone="green"
					value={number(stats.projects.delivered.value)}
					compared={stats.projects.delivered}
					versus={versus}
					href="/dashboard/projects?stage=DELIVERY"
				/>
				<KpiCard
					label={t("kpi.bookedValue")}
					icon={Wallet}
					tone="gold"
					value={formatMoney(stats.money.booked.value, locale)}
					compared={stats.money.booked}
					versus={versus}
				/>
				<KpiCard
					label={t("kpi.outstanding")}
					icon={WalletCards}
					tone="red"
					value={formatMoney(stats.money.outstanding, locale)}
					hint={t("hint.now")}
				/>
				<KpiCard
					label={t("kpi.files")}
					icon={HardDrive}
					tone="teal"
					value={number(stats.files.count.value)}
					compared={stats.files.count}
					versus={[versus, formatBytes(stats.files.bytes, locale)]
						.filter(Boolean)
						.join(" · ")}
					href="/dashboard/portfolio/files"
				/>
				<KpiCard
					label={t("kpi.shootsNextWeek")}
					icon={Camera}
					tone="amber"
					value={number(stats.shootsNextWeek)}
					hint={t("hint.next7")}
					href="/dashboard/calendar"
				/>
				<KpiCard
					label={t("kpi.activeProjects")}
					icon={FolderKanban}
					tone="purple"
					value={number(activeProjects)}
					hint={t("hint.now")}
					href="/dashboard/projects"
				/>
				<KpiCard
					label={t("kpi.totalClients")}
					icon={Users}
					tone="blue"
					value={number(stats.clients.total)}
					hint={t("hint.now")}
					href="/dashboard/clients"
				/>
			</div>

			<div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
				<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 xl:col-span-2">
					<h2 className="text-sm font-semibold">{t("chart.title")}</h2>
					<ActivityChart
						series={stats.series}
						granularity={period.granularity}
					/>
				</section>
				<UpcomingShoots shoots={stats.upcoming} />
			</div>

			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<BreakdownCard
					title={t("breakdown.bookings")}
					empty={t("breakdown.empty")}
					rows={BOOKING_STATUSES.map((status) => ({
						key: status,
						label: tStatus(status),
						count: stats.bookings.byStatus[status] ?? 0,
						bar: STATUS_BAR[status],
					}))}
				/>
				<BreakdownCard
					title={t("breakdown.projects")}
					empty={t("breakdown.empty")}
					rows={PROJECT_STAGES.map((stage) => ({
						key: stage,
						label: tStage(stage),
						count: stats.projects.byStage[stage] ?? 0,
						bar: STAGE_BAR[stage],
					}))}
				/>
			</div>
		</div>
	);
}

export function StatisticsSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
				{Array.from({ length: 12 }, (_, i) => `kpi-${i}`).map((key) => (
					<div
						key={key}
						className="h-[74px] animate-pulse rounded-xl border border-border bg-card"
					/>
				))}
			</div>
			<div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
				<div className="h-72 animate-pulse rounded-xl border border-border bg-card xl:col-span-2" />
				<div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
			</div>
		</div>
	);
}
