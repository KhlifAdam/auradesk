import {
	CalendarClock,
	CheckCircle2,
	ChevronRight,
	CreditCard,
	Heart,
	Inbox,
	MailOpen,
	MapPin,
	MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { PortalHome } from "@/services/portal/home-queries";
import { formatMoney } from "@/services/projects/money";

function TodoItem({
	href,
	icon,
	children,
}: {
	href: string;
	icon: ReactNode;
	children: ReactNode;
}) {
	return (
		<li>
			<Link
				href={href}
				className="group/todo flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm transition-all duration-200 hover:bg-primary/8 active:scale-[0.99]"
			>
				<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary transition-transform duration-300 group-hover/todo:scale-110">
					{icon}
				</span>
				<span className="min-w-0 flex-1 truncate">{children}</span>
				<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/todo:translate-x-0.5" />
			</Link>
		</li>
	);
}

/** The next shoot, and everything waiting on the client. */
export async function PortalDashboard({ home }: { home: PortalHome }) {
	const t = await getTranslations("Portal.home");
	const format = await getFormatter();
	const locale = await getLocale();
	const { nextShoot } = home;
	const iconClass = "h-3.5 w-3.5";

	const todos = [
		home.bookings > 0 && (
			<TodoItem
				key="bookings"
				href="#booking-requests"
				icon={<Inbox className={iconClass} />}
			>
				{t("todo.bookings", { count: home.bookings })}
			</TodoItem>
		),
		home.invitations > 0 && (
			<TodoItem
				key="invitations"
				href="#invitations"
				icon={<MailOpen className={iconClass} />}
			>
				{t("todo.invitations", { count: home.invitations })}
			</TodoItem>
		),
		...home.selections.map((gallery) => (
			<TodoItem
				key={gallery.galleryId}
				href={`/portal/galleries/${gallery.galleryId}`}
				icon={<Heart className={iconClass} />}
			>
				{t("todo.select", {
					gallery: gallery.title,
					project: gallery.projectTitle,
				})}
			</TodoItem>
		)),
		...home.balances.map((project) => (
			<TodoItem
				key={project.projectId}
				href={`/portal/projects/${project.projectId}`}
				icon={<CreditCard className={iconClass} />}
			>
				{t("todo.balance", {
					amount: formatMoney(project.remaining, locale),
					project: project.title,
				})}
			</TodoItem>
		)),
		home.unread > 0 && (
			<TodoItem
				key="messages"
				href="/portal/messages"
				icon={<MessageSquare className={iconClass} />}
			>
				{t("todo.messages", { count: home.unread })}
			</TodoItem>
		),
	].filter(Boolean);

	return (
		<div className="grid gap-3 md:grid-cols-[18rem_1fr]">
			<section className="relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-border/70 bg-card/75 p-5 shadow-sm backdrop-blur-md">
				<h2 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
					<CalendarClock className="h-3.5 w-3.5" />
					{t("nextShoot")}
				</h2>
				{nextShoot ? (
					<Link
						href={`/portal/projects/${nextShoot.projectId}`}
						className="group flex flex-col gap-1"
					>
						<span className="font-display text-lg font-bold leading-tight group-hover:text-primary">
							{format.dateTime(new Date(nextShoot.eventDate), {
								weekday: "long",
								day: "numeric",
								month: "long",
								timeZone: "UTC",
							})}
							{nextShoot.startTime && ` · ${nextShoot.startTime}`}
						</span>
						<span className="text-sm">{nextShoot.title}</span>
						<span className="text-xs text-muted-foreground">
							{nextShoot.studio}
						</span>
						{nextShoot.location && (
							<span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
								<MapPin className="h-3 w-3 shrink-0" />
								{/^https?:\/\//i.test(nextShoot.location)
									? t("mapLink")
									: nextShoot.location}
							</span>
						)}
					</Link>
				) : (
					<p className="text-sm text-muted-foreground">{t("noShoot")}</p>
				)}
			</section>
			<section className="flex flex-col gap-1 rounded-2xl border border-border/70 bg-card/75 p-4 shadow-sm backdrop-blur-md">
				<h2 className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
					{t("todo.title")}
				</h2>
				{todos.length > 0 ? (
					<ul className="flex flex-col">{todos}</ul>
				) : (
					<p className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
						<CheckCircle2 className="h-4 w-4 text-success" />
						{t("todo.none")}
					</p>
				)}
			</section>
		</div>
	);
}
