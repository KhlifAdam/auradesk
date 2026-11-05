import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { BookingDetail } from "@/services/bookings/types";
import { formatMoney } from "@/services/projects/money";

function Card({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
			<h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
			<dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
		</section>
	);
}

const isUrl = (value: string) => /^https?:\/\//i.test(value);

/** Read-only sheet of the request: who, what, when, and the money. */
export async function BookingFacts({ booking }: { booking: BookingDetail }) {
	const t = await getTranslations("Bookings.facts");
	const tService = await getTranslations("Projects.serviceTypes");
	const tMedia = await getTranslations("Projects.mediaTypes");
	const tSource = await getTranslations("Bookings.source");
	const format = await getFormatter();
	const locale = await getLocale();

	/** One labelled value; an empty one says so, and notes what confirming needs. */
	const Fact = ({
		label,
		children,
		toConfirm,
	}: {
		label: string;
		children: ReactNode;
		/** Empty, and needed before the booking can be confirmed. */
		toConfirm?: boolean;
	}) => (
		<div className="flex flex-col gap-0.5">
			<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</dt>
			<dd className="whitespace-pre-wrap break-words text-sm">
				{children || (
					<span className="text-muted-foreground/70">
						{toConfirm ? t("toConfirm") : t("notSet")}
					</span>
				)}
			</dd>
		</div>
	);

	const date = (iso: string | null) =>
		iso
			? format.dateTime(new Date(iso), { dateStyle: "long", timeZone: "UTC" })
			: null;
	const money = (value: number | null) =>
		value === null ? null : formatMoney(value, locale);
	const when = [
		date(booking.desiredDate),
		booking.startTime,
		booking.durationMinutes &&
			t("hours", { count: booking.durationMinutes / 60 }),
	]
		.filter(Boolean)
		.join(" · ");

	return (
		<div className="flex flex-col gap-3">
			<Card title={t("client")}>
				<Fact label={t("name")}>{booking.clientName}</Fact>
				<Fact label={t("email")}>{booking.clientEmail}</Fact>
				<Fact label={t("phone")}>{booking.clientPhone}</Fact>
				<Fact label={t("source")}>{tSource(booking.source)}</Fact>
			</Card>
			<Card title={t("need")}>
				<Fact label={t("type")}>{tService(booking.serviceType)}</Fact>
				<Fact label={t("media")}>{tMedia(booking.mediaType)}</Fact>
				<Fact
					label={t("when")}
					toConfirm={!booking.desiredDate || !booking.startTime}
				>
					{when}
				</Fact>
				<Fact label={t("where")} toConfirm={!booking.location}>
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
			</Card>
			<Card title={t("quote")}>
				<Fact label={t("budget")}>{money(booking.clientBudget)}</Fact>
				<Fact label={t("price")}>{money(booking.proposedPrice)}</Fact>
				<Fact label={t("advance")}>{money(booking.plannedAdvance)}</Fact>
				<Fact label={t("deadline")}>{date(booking.responseDeadline)}</Fact>
				<Fact label={t("notes")}>{booking.internalNotes}</Fact>
			</Card>
		</div>
	);
}
