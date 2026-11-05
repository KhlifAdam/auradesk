import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BookingRequests } from "@/components/portal/bookings/booking-requests";

export default async function PortalBookingsPage() {
	const t = await getTranslations("Portal.bookings");

	return (
		<>
			<div className="flex flex-col gap-1.5">
				<h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
					{t("pageTitle")}
				</h1>
				<p className="text-sm text-muted-foreground md:text-base">
					{t("pageDescription")}
				</p>
			</div>
			<Suspense>
				<BookingRequests showEmpty />
			</Suspense>
		</>
	);
}
