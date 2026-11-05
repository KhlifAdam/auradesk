import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ChangePill, changeHighlight } from "@/components/shared/change-mark";
import { cn } from "@/lib/utils";
import type { PortalBookingSummary } from "@/services/portal/booking-queries";

/** What the client has to do about a request, as a short label and tone. */
export function requestState(booking: {
	status: PortalBookingSummary["status"];
	accepted: boolean;
	requestedByClient: boolean;
	proposedPrice: number | null;
}) {
	if (booking.status === "CONFIRMED")
		return { key: "confirmed", tone: "text-success bg-success/10" } as const;
	if (booking.status === "DECLINED")
		return {
			key: "declined",
			tone: "text-destructive bg-destructive/10",
		} as const;
	// Accepted, or their own request the studio hasn't answered yet: once the
	// studio proposes a price, it is the client's turn.
	if (
		booking.accepted ||
		(booking.requestedByClient &&
			booking.status === "NEW" &&
			booking.proposedPrice === null)
	)
		return {
			key: "waitingStudio",
			tone: "text-primary bg-primary/10",
		} as const;
	return { key: "toAnswer", tone: "text-primary bg-primary/10" } as const;
}

export async function BookingRequestCard({
	booking,
}: {
	booking: PortalBookingSummary;
}) {
	const t = await getTranslations("Portal.bookings");
	const format = await getFormatter();
	const state = requestState(booking);

	return (
		<Link
			href={`/portal/bookings/${booking.id}`}
			className={cn(
				"group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/40",
				changeHighlight(booking.mark),
			)}
		>
			<div className="min-w-0">
				<p className="flex items-center gap-2 font-medium group-hover:text-primary">
					<span className="truncate">{booking.title}</span>
					<ChangePill mark={booking.mark} />
				</p>
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
			<div className="flex shrink-0 items-center gap-2">
				<span
					className={cn(
						"rounded px-1.5 py-0.5 text-[10px] font-medium",
						state.tone,
					)}
				>
					{t(`state.${state.key}`)}
				</span>
				<ChevronRight className="h-4 w-4 text-muted-foreground" />
			</div>
		</Link>
	);
}
