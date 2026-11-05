import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import {
	ChangePill,
	changeRowHighlight,
} from "@/components/shared/change-mark";
import { cn } from "@/lib/utils";
import { isOpenStatus } from "@/services/bookings/options";
import type { BookingSummary } from "@/services/bookings/types";
import { BookingStatusBadge } from "./booking-status-badge";

/** Booking rows: title, who and what, the wished date, status. */
export async function BookingList({
	bookings,
}: {
	bookings: BookingSummary[];
}) {
	const t = await getTranslations("Bookings.list");
	const tService = await getTranslations("Projects.serviceTypes");
	const format = await getFormatter();

	return (
		<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
			{bookings.map((booking) => (
				<li key={booking.id}>
					<Link
						href={`/dashboard/bookings/${booking.id}`}
						className={cn(
							"flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 transition-colors duration-200 hover:bg-muted/50",
							changeRowHighlight(booking.mark),
						)}
					>
						<div className="min-w-0 flex-1">
							<p className="flex items-center gap-2 text-sm font-medium">
								<span className="truncate">{booking.title}</span>
								<ChangePill mark={booking.mark} />
							</p>
							<p className="truncate text-xs text-muted-foreground">
								{booking.clientName} · {tService(booking.serviceType)}
							</p>
						</div>
						<div className="flex items-center gap-3 text-xs text-muted-foreground">
							<span className="flex items-center gap-1">
								<CalendarDays className="h-3 w-3" />
								{booking.desiredDate
									? format.dateTime(new Date(booking.desiredDate), {
											dateStyle: "medium",
											timeZone: "UTC",
										})
									: t("noDate")}
							</span>
							{isOpenStatus(booking.status) && booking.incomplete && (
								<span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
									{t("incomplete")}
								</span>
							)}
							<BookingStatusBadge status={booking.status} />
							<span className="hidden items-center gap-0.5 text-foreground sm:flex">
								{t("viewDetails")}
								<ChevronRight className="h-3.5 w-3.5" />
							</span>
						</div>
					</Link>
				</li>
			))}
		</ul>
	);
}
