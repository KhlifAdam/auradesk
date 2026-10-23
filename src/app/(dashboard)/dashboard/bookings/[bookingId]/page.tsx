import { ArrowLeft, ArrowUpRight, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BookingActionsBar } from "@/components/dashboard/bookings/booking-actions-bar";
import { BookingActivity } from "@/components/dashboard/bookings/booking-activity";
import { BookingChecklist } from "@/components/dashboard/bookings/booking-checklist";
import { BookingClientStatus } from "@/components/dashboard/bookings/booking-client-status";
import { BookingDeleteButton } from "@/components/dashboard/bookings/booking-delete-button";
import { BookingFacts } from "@/components/dashboard/bookings/booking-facts";
import { BookingStatusBadge } from "@/components/dashboard/bookings/booking-status-badge";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { bookingCompleteness } from "@/services/bookings/completeness";
import { isOpenStatus } from "@/services/bookings/options";
import { getBooking } from "@/services/bookings/queries";

export default async function BookingPage({
	params,
}: {
	params: Promise<{ bookingId: string }>;
}) {
	const t = await getTranslations("Bookings.detail");
	const { bookingId } = await params;
	const { photographerId } = await requirePhotographer();
	const booking = await getBooking(photographerId, bookingId);
	if (!booking) notFound();
	const completeness = bookingCompleteness(booking);
	const isOpen = isOpenStatus(booking.status);

	return (
		<PageShell>
			<Link
				href="/dashboard/bookings"
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("back")}
			</Link>
			<PageHeader
				title={booking.title}
				description={booking.clientName}
				actions={
					<>
						<BookingStatusBadge status={booking.status} />
						<BookingDeleteButton bookingId={booking.id} />
						{booking.status !== "CONFIRMED" && (
							<Button
								asChild
								size="sm"
								variant="outline"
								className="h-7 gap-1.5 text-xs"
							>
								<Link href={`/dashboard/bookings/${booking.id}/edit`}>
									<Pencil className="h-3.5 w-3.5" />
									{t("edit")}
								</Link>
							</Button>
						)}
					</>
				}
			/>
			<BookingActionsBar
				bookingId={booking.id}
				status={booking.status}
				hasProject={Boolean(booking.project)}
				blocked={completeness.required.length > 0}
				sentToClient={Boolean(booking.sentToClientAt)}
				canSend={Boolean(booking.clientEmail || booking.clientPhone)}
				clientAccepted={Boolean(booking.clientAcceptedAt)}
			/>
			{isOpen && (
				<BookingClientStatus
					sentToClientAt={booking.sentToClientAt}
					clientAcceptedAt={booking.clientAcceptedAt}
				/>
			)}
			{isOpen && (
				<BookingChecklist bookingId={booking.id} completeness={completeness} />
			)}
			{booking.project && (
				<Link
					href={`/dashboard/projects/${booking.project.id}`}
					className="flex w-fit items-center gap-1.5 rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-colors duration-200 hover:bg-success/20"
				>
					{t("projectCreated", { title: booking.project.title })}
					<ArrowUpRight className="h-3.5 w-3.5" />
				</Link>
			)}
			{booking.status === "DECLINED" && booking.statusReason && (
				<p className="max-w-3xl rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
					<span className="font-medium">{t("reason")}</span>{" "}
					{booking.statusReason}
				</p>
			)}
			<div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
				<BookingFacts booking={booking} />
				<BookingActivity
					bookingId={booking.id}
					activities={booking.activities}
				/>
			</div>
		</PageShell>
	);
}
