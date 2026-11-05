import { getTranslations } from "next-intl/server";
import { Item } from "@/components/dashboard/bookings/booking-checklist";
import { cn } from "@/lib/utils";
import { bookingCompleteness } from "@/services/bookings/completeness";
import type { PortalBookingDetail } from "@/services/portal/booking-queries";
import { ClientBookingAnswer } from "./client-booking-answer";

/** What is still missing before the client can accept, and the answer buttons. */
export async function BookingAnswerAside({
	booking,
}: {
	booking: PortalBookingDetail;
}) {
	const t = await getTranslations("Portal.bookings");
	const { required } = bookingCompleteness(booking, {
		forClient: true,
	});
	const incomplete = required.length > 0;

	return (
		<aside
			id="answer"
			className="order-first flex scroll-mt-24 flex-col gap-3 self-start lg:sticky lg:top-20 lg:order-last"
		>
			<section
				className={cn(
					"flex flex-col gap-3 rounded-xl border-2 bg-card/80 p-4 shadow-sm backdrop-blur-sm",
					incomplete ? "border-border" : "border-primary/50",
				)}
			>
				<div className="flex flex-col gap-1">
					<h2 className="font-display text-base font-bold tracking-tight">
						{t("answer.title")}
					</h2>
					<p className="text-xs text-muted-foreground">
						{incomplete ? t("answer.incomplete") : t("answer.hint")}
					</p>
				</div>
				<ul className="flex flex-col gap-1.5">
					<Item
						label={t("checklist.desiredDate")}
						tag={t("checklist.required")}
						state={required.includes("desiredDate") ? "missing" : "done"}
					/>
					<Item
						label={t("checklist.proposedPrice")}
						tag={t("checklist.required")}
						state={required.includes("proposedPrice") ? "missing" : "done"}
					/>
					<Item
						label={t("checklist.location")}
						tag={t("checklist.required")}
						state={required.includes("location") ? "missing" : "done"}
					/>
					<Item
						label={t("checklist.startTime")}
						tag={t("checklist.required")}
						state={required.includes("startTime") ? "missing" : "done"}
					/>
				</ul>
				<ClientBookingAnswer bookingId={booking.id} incomplete={incomplete} />
			</section>
		</aside>
	);
}
