import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { PortalBookingSummary } from "@/services/portal/booking-queries";

/** A request waiting on the client's answer: big, tinted, with one clear action. */
export async function BookingActionCard({
	booking,
}: {
	booking: PortalBookingSummary;
}) {
	const t = await getTranslations("Portal.bookings");
	const format = await getFormatter();

	return (
		<Link
			href={`/portal/bookings/${booking.id}`}
			className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary hover:shadow-md"
		>
			<div className="min-w-0">
				<p className="truncate text-base font-semibold">{booking.title}</p>
				<p className="flex items-center gap-2 text-xs text-muted-foreground">
					<span className="truncate">{booking.studioName}</span>
					{booking.desiredDate && (
						<span className="flex shrink-0 items-center gap-1">
							<CalendarDays className="h-3 w-3" />
							{format.dateTime(new Date(booking.desiredDate), {
								dateStyle: "medium",
								timeZone: "UTC",
							})}
						</span>
					)}
				</p>
			</div>
			<Button asChild size="sm" className="h-8 gap-1.5 text-xs">
				<span>
					{t("review")}
					<ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
				</span>
			</Button>
		</Link>
	);
}
