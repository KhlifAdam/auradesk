import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { PortalBookingDetail } from "@/services/portal/booking-queries";
import { formatMoney } from "@/services/projects/money";

const isUrl = (value: string) => /^https?:\/\//i.test(value);

function Card({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<h2 className="text-sm font-semibold">{title}</h2>
			<dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
		</section>
	);
}

/** The studio's side of the request, and the client's side once it is closed. */
export async function BookingReadonly({
	booking,
	showClientPart,
}: {
	booking: PortalBookingDetail;
	/** The client's own details, shown read-only once they can't be edited. */
	showClientPart: boolean;
}) {
	const t = await getTranslations("Portal.bookings.facts");
	const tService = await getTranslations("Projects.serviceTypes");
	const tMedia = await getTranslations("Projects.mediaTypes");
	const format = await getFormatter();
	const locale = await getLocale();

	const date = (iso: string | null) =>
		iso
			? format.dateTime(new Date(iso), { dateStyle: "long", timeZone: "UTC" })
			: null;
	const money = (value: number | null) =>
		value === null ? null : formatMoney(value, locale);

	const Fact = ({
		label,
		children,
	}: {
		label: string;
		children: ReactNode;
	}) => (
		<div className="flex flex-col gap-0.5">
			<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</dt>
			<dd className="whitespace-pre-wrap break-words text-sm">
				{children || (
					<span className="text-muted-foreground/70">{t("notSet")}</span>
				)}
			</dd>
		</div>
	);

	return (
		<>
			<Card title={t("proposal")}>
				<Fact label={t("price")}>{money(booking.proposedPrice)}</Fact>
				<Fact label={t("advance")}>{money(booking.plannedAdvance)}</Fact>
				<Fact label={t("deadline")}>{date(booking.responseDeadline)}</Fact>
			</Card>
			{showClientPart && (
				<Card title={t("yourDetails")}>
					<Fact label={t("name")}>{booking.clientName}</Fact>
					<Fact label={t("phone")}>{booking.clientPhone}</Fact>
					<Fact label={t("service")}>{tService(booking.serviceType)}</Fact>
					<Fact label={t("media")}>{tMedia(booking.mediaType)}</Fact>
					<Fact label={t("date")}>
						{[date(booking.desiredDate), booking.startTime]
							.filter(Boolean)
							.join(" · ")}
					</Fact>
					<Fact label={t("location")}>
						{isUrl(booking.location) ? (
							<a
								href={booking.location}
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary underline-offset-2 hover:underline"
							>
								{t("openMap")}
							</a>
						) : (
							booking.location
						)}
					</Fact>
					<Fact label={t("description")}>{booking.description}</Fact>
					<Fact label={t("budget")}>{money(booking.clientBudget)}</Fact>
				</Card>
			)}
		</>
	);
}
