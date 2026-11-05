import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BookingRequests } from "@/components/portal/bookings/booking-requests";
import { Button } from "@/components/ui/button";

export default async function PortalBookingsPage() {
	const t = await getTranslations("Portal.bookings");

	return (
		<>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div className="flex flex-col gap-1.5">
					<h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
						{t("pageTitle")}
					</h1>
					<p className="text-sm text-muted-foreground md:text-base">
						{t("pageDescription")}
					</p>
				</div>
				{/* Each studio has its own request button: pick the studio first. */}
				<Button asChild size="sm" className="h-8 gap-1.5 text-xs">
					<Link href="/portal/studios">
						<CalendarPlus className="h-3.5 w-3.5" />
						{t("newBooking")}
					</Link>
				</Button>
			</div>
			<Suspense>
				<BookingRequests showEmpty />
			</Suspense>
		</>
	);
}
