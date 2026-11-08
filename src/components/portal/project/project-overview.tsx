import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PaymentBadge } from "@/components/dashboard/projects/payment-badge";
import type { PortalProjectDetail } from "@/services/portal/types";
import { amountRemaining, formatMoney } from "@/services/projects/money";

const isUrl = (value: string) => /^https?:\/\//i.test(value);

function Fact({ label, children }: { label: string; children: ReactNode }) {
	if (!children) return null;
	return (
		<div className="flex flex-col gap-0.5">
			<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</dt>
			<dd className="whitespace-pre-wrap break-words text-sm">{children}</dd>
		</div>
	);
}

/** What the shoot is, when and where, and where the payment stands. */
export async function ProjectOverview({
	project,
}: {
	project: PortalProjectDetail;
}) {
	const t = await getTranslations("Portal.project.overview");
	const tService = await getTranslations("Projects.serviceTypes");
	const tMedia = await getTranslations("Projects.mediaTypes");
	const tLocation = await getTranslations("Projects.locationTypes");
	const format = await getFormatter();
	const locale = await getLocale();

	const day = (iso: string | null) =>
		iso
			? format.dateTime(new Date(iso), { dateStyle: "full", timeZone: "UTC" })
			: null;
	const hours = project.startTime
		? project.endTime
			? `${project.startTime} – ${project.endTime}`
			: project.startTime
		: null;
	const remaining = amountRemaining(
		project.price,
		project.advance,
		project.discount,
	);
	const money = (value: number | null) =>
		value === null ? "—" : formatMoney(value, locale);

	return (
		<div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
			<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				<dl className="grid gap-3 sm:grid-cols-2">
					<Fact label={t("service")}>
						{`${tService(project.serviceType)} · ${tMedia(project.mediaType)}`}
					</Fact>
					<Fact label={t("date")}>
						{[day(project.eventDate), hours].filter(Boolean).join(" · ")}
					</Fact>
					<Fact label={t("location")}>
						{project.location &&
							(isUrl(project.location) ? (
								<a
									href={project.location}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline-offset-2 hover:underline"
								>
									{t("openMap")}
								</a>
							) : (
								project.location
							))}
						{project.locationType && ` · ${tLocation(project.locationType)}`}
					</Fact>
					<Fact label={t("deadline")}>{day(project.deliveryDeadline)}</Fact>
				</dl>
				{project.description && (
					<p className="whitespace-pre-wrap text-sm text-muted-foreground">
						{project.description}
					</p>
				)}
			</section>
			{project.price !== null && (
				<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
					<div className="flex items-center justify-between gap-2">
						<h2 className="text-sm font-semibold">{t("payment")}</h2>
						<PaymentBadge status={project.paymentStatus} />
					</div>
					<dl className="flex flex-col gap-1.5 text-sm">
						{[
							[t("price"), money(project.price)],
							...(project.discount > 0
								? [[t("discount"), `− ${money(project.discount)}`]]
								: []),
							[t("paid"), money(project.advance)],
							[t("remaining"), money(remaining)],
						].map(([label, value], index, rows) => (
							<div
								key={label}
								className={
									index === rows.length - 1
										? "flex justify-between border-t border-border pt-1.5 font-semibold"
										: "flex justify-between"
								}
							>
								<dt className="text-muted-foreground">{label}</dt>
								<dd className="tabular-nums">{value}</dd>
							</div>
						))}
					</dl>
					{project.paymentStatus !== "PAID" && (
						<p className="text-xs text-muted-foreground">{t("paymentHint")}</p>
					)}
				</section>
			)}
		</div>
	);
}
