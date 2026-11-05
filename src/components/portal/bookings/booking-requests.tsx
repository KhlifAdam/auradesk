import { CalendarCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { requireClient } from "@/lib/auth/require-client";
import { listPortalBookings } from "@/services/portal/booking-queries";
import { AttentionPanel } from "../attention-panel";
import { BookingActionCard } from "./booking-action-card";
import { BookingRequestCard, requestState } from "./booking-request-card";

/** Requests a studio sent to this client; nothing renders when there are none. */
export async function BookingRequests({
	showEmpty = false,
}: {
	/** Say so when there is nothing, instead of rendering nothing. */
	showEmpty?: boolean;
}) {
	const t = await getTranslations("Portal.bookings");
	const { session } = await requireClient();
	const bookings = await listPortalBookings(session.user);
	if (bookings.length === 0)
		return showEmpty ? (
			<EmptyState
				icon={CalendarCheck}
				title={t("empty.title")}
				description={t("empty.description")}
			/>
		) : null;

	// What needs an answer comes first and stands out; the rest is a plain list.
	const toAnswer = bookings.filter((b) => requestState(b).key === "toAnswer");
	const others = bookings.filter((b) => requestState(b).key !== "toAnswer");

	return (
		<section id="booking-requests" className="flex scroll-mt-20 flex-col gap-5">
			{toAnswer.length > 0 && (
				<AttentionPanel title={t("needsAnswer", { count: toAnswer.length })}>
					{toAnswer.map((booking) => (
						<BookingActionCard key={booking.id} booking={booking} />
					))}
				</AttentionPanel>
			)}
			{others.length > 0 && (
				<div className="flex flex-col gap-3">
					<h2 className="text-sm font-semibold">
						{toAnswer.length > 0
							? t("others", { count: others.length })
							: t("title", { count: others.length })}
					</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						{others.map((booking) => (
							<BookingRequestCard key={booking.id} booking={booking} />
						))}
					</div>
				</div>
			)}
		</section>
	);
}
