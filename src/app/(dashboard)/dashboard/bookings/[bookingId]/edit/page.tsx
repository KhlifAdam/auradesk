import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BookingForm } from "@/components/dashboard/bookings/form/booking-form";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { getBookingQuote } from "@/services/bookings/booking-quote";
import { bookingToValues } from "@/services/bookings/form-values";
import { getBooking } from "@/services/bookings/queries";

export default async function EditBookingPage({
	params,
}: {
	params: Promise<{ bookingId: string }>;
}) {
	const t = await getTranslations("Bookings.form");
	const tService = await getTranslations("Projects.serviceTypes");
	const { bookingId } = await params;
	const { photographerId } = await requirePhotographer();
	const booking = await getBooking(photographerId, bookingId);
	if (!booking) notFound();
	// A confirmed booking now lives on as a project.
	if (booking.status === "CONFIRMED")
		redirect(`/dashboard/bookings/${booking.id}`);

	return (
		<PageShell>
			<Link
				href={`/dashboard/bookings/${booking.id}`}
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("backToBooking")}
			</Link>
			<PageHeader title={t("editTitle")} description={booking.title} />
			<BookingForm
				bookingId={booking.id}
				initial={bookingToValues(
					booking,
					await getBookingQuote({ photographerId }, booking.id),
					tService(booking.serviceType),
				)}
			/>
		</PageShell>
	);
}
