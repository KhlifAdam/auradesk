import {
	ArrowRight,
	CalendarHeart,
	Download,
	Heart,
	Sparkles,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
	type ClientNextStep,
	clientNextStep,
} from "@/lib/projects/client-next-step";
import type { InvoiceSummary } from "@/services/invoices/types";
import type { PortalProjectDetail } from "@/services/portal/types";
import { getProjectEstimate } from "@/services/projects/estimate";
import { formatMoney } from "@/services/projects/money";

const ICONS: Record<ClientNextStep, typeof Heart> = {
	waitShoot: CalendarHeart,
	chooseFiles: Heart,
	waitStudio: Sparkles,
	payBalance: Wallet,
	downloadFiles: Download,
};

/**
 * The one thing that matters for the client right now, with a button to do
 * it, and when the studio expects to be done.
 */
export async function ProjectNextStep({
	project,
	invoices,
}: {
	project: PortalProjectDetail;
	invoices: InvoiceSummary[];
}) {
	const t = await getTranslations("Portal.next");
	const format = await getFormatter();
	const locale = await getLocale();
	const { step, targetId } = clientNextStep(project, invoices);
	const estimate = project.delivered
		? null
		: await getProjectEstimate(project.photographerId, project.id);
	const Icon = ICONS[step];
	const owed = invoices.reduce((sum, i) => sum + Math.max(0, i.balance), 0);
	const day = (iso: string) =>
		format.dateTime(new Date(iso), {
			weekday: "long",
			day: "numeric",
			month: "long",
			timeZone: "UTC",
		});
	const studio = project.studio?.name ?? project.photographerName;

	const href =
		step === "chooseFiles" || step === "downloadFiles"
			? targetId && `/portal/galleries/${targetId}`
			: step === "payBalance"
				? targetId && `/portal/invoices/${targetId}`
				: null;

	return (
		<section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card p-4">
			<div className="flex flex-wrap items-center gap-4">
				<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
					<Icon className="h-5 w-5" />
				</span>
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<span className="text-[11px] font-medium tracking-wide text-primary uppercase">
						{t("label")}
					</span>
					<h2 className="font-display text-base font-semibold">
						{t(`${step}.title`)}
					</h2>
					<p className="text-xs text-muted-foreground">
						{t(`${step}.body`, {
							studio,
							amount: formatMoney(owed, locale),
							date: project.eventDate ? day(project.eventDate) : "—",
						})}
					</p>
				</div>
				{href && (
					<Button asChild size="sm" className="gap-1.5">
						<Link href={href}>
							{t(`${step}.cta`)}
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</Button>
				)}
			</div>
			{estimate && !estimate.estimate.done && step !== "waitShoot" && (
				<p className="mt-3 border-t border-border/60 pt-2 text-xs text-muted-foreground">
					{t("expected", {
						date: day(`${estimate.estimate.finishDate}T12:00:00Z`),
					})}
				</p>
			)}
		</section>
	);
}
