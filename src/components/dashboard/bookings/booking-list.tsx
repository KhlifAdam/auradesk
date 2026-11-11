import { CalendarDays, User } from "lucide-react";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import {
	CARD,
	CARD_GRID,
	CARD_MEDIA,
} from "@/components/dashboard/shared/card-grid";
import { SERVICE_ICONS } from "@/components/dashboard/shared/service-icon";
import {
	ChangePill,
	changeRowHighlight,
} from "@/components/shared/change-mark";
import { cn } from "@/lib/utils";
import { isOpenStatus } from "@/services/bookings/options";
import type { BookingSummary } from "@/services/bookings/types";
import { formatMoney } from "@/services/projects/money";
import { BookingStatusBadge } from "./booking-status-badge";

/** Booking cards: the kind of shoot, title and price, who, the wished date, status. */
export async function BookingList({
	bookings,
}: {
	bookings: BookingSummary[];
}) {
	const t = await getTranslations("Bookings.list");
	const tService = await getTranslations("Projects.serviceTypes");
	const format = await getFormatter();
	const locale = await getLocale();

	return (
		<ul className={CARD_GRID}>
			{bookings.map((booking) => {
				const Icon = SERVICE_ICONS[booking.serviceType];
				return (
					<li key={booking.id}>
						<Link
							href={`/dashboard/bookings/${booking.id}`}
							className={cn(CARD, "h-full", changeRowHighlight(booking.mark))}
						>
							<div className={CARD_MEDIA}>
								<Icon className="h-6 w-6 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
								<span className="absolute bottom-1.5 left-2 text-[11px] font-medium text-muted-foreground">
									{tService(booking.serviceType)}
								</span>
								<span className="absolute right-1.5 top-1.5">
									<ChangePill mark={booking.mark} />
								</span>
							</div>
							<div className="flex flex-1 flex-col gap-1.5 p-2.5">
								<div className="flex items-start justify-between gap-2">
									<span className="truncate text-sm font-medium">
										{booking.title}
									</span>
									{booking.proposedPrice !== null && (
										<span className="shrink-0 text-sm font-semibold text-primary">
											{formatMoney(booking.proposedPrice, locale)}
										</span>
									)}
								</div>
								<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
									<span className="flex min-w-0 items-center gap-1">
										<User className="h-3 w-3 shrink-0" />
										<span className="truncate">{booking.clientName}</span>
									</span>
									<span className="flex items-center gap-1">
										<CalendarDays className="h-3 w-3" />
										{booking.desiredDate
											? format.dateTime(new Date(booking.desiredDate), {
													dateStyle: "medium",
													timeZone: "UTC",
												})
											: t("noDate")}
									</span>
								</div>
								<div className="mt-auto flex flex-wrap gap-1">
									<BookingStatusBadge status={booking.status} />
									{isOpenStatus(booking.status) && booking.incomplete && (
										<span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
											{t("incomplete")}
										</span>
									)}
								</div>
							</div>
						</Link>
					</li>
				);
			})}
		</ul>
	);
}
