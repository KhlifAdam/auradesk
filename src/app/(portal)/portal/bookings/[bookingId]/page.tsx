import { ArrowLeft, ArrowUpRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BookingReadonly } from "@/components/portal/bookings/booking-readonly";
import { requestState } from "@/components/portal/bookings/booking-request-card";
import { ClientBookingAnswer } from "@/components/portal/bookings/client-booking-answer";
import { ClientBookingForm } from "@/components/portal/bookings/client-booking-form";
import { PortfolioLink } from "@/components/portal/portfolio-link";
import { Button } from "@/components/ui/button";
import { requireClient } from "@/lib/auth/require-client";
import { cn } from "@/lib/utils";
import { bookingCompleteness } from "@/services/bookings/completeness";
import { getPortalBooking } from "@/services/portal/booking-queries";

export default async function PortalBookingPage({
	params,
}: {
	params: Promise<{ bookingId: string }>;
}) {
	const t = await getTranslations("Portal.bookings");
	const tStudios = await getTranslations("Portal.studios");
	const { bookingId } = await params;
	const { session } = await requireClient();
	const booking = await getPortalBooking(session.user, bookingId);
	if (!booking) notFound();

	const state = requestState(booking);
	const incomplete =
		bookingCompleteness({
			desiredDate: booking.desiredDate,
			proposedPrice: booking.proposedPrice,
		}).required.length > 0;

	return (
		<>
			<Link
				href="/portal"
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("back")}
			</Link>
			<div className="flex flex-col gap-1">
				<p className="text-sm font-semibold">{booking.studioName}</p>
				<h1 className="font-display text-2xl font-bold tracking-tight">
					{booking.title}
				</h1>
				<p
					className={cn(
						"w-fit rounded px-1.5 py-0.5 text-xs font-medium",
						state.tone,
					)}
				>
					{t(`state.${state.key}`)}
				</p>
			</div>
			<div className="flex flex-wrap gap-2">
				{booking.siteSlug && <PortfolioLink slug={booking.siteSlug} />}
				<Button
					asChild
					variant="outline"
					size="sm"
					className="h-8 gap-1.5 text-xs"
				>
					<Link href={`/portal/messages?studio=${booking.photographerId}`}>
						<MessageSquare className="h-3.5 w-3.5" />
						{tStudios("message")}
					</Link>
				</Button>
			</div>
			{booking.status === "DECLINED" && booking.statusReason && (
				<p className="max-w-3xl rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
					<span className="font-medium">{t("reason")}</span>{" "}
					{booking.statusReason}
				</p>
			)}
			{booking.status === "CONFIRMED" && booking.projectId && (
				<Link
					href={`/portal/projects/${booking.projectId}`}
					className="flex w-fit items-center gap-1.5 rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-colors duration-200 hover:bg-success/20"
				>
					{t("openProject")}
					<ArrowUpRight className="h-3.5 w-3.5" />
				</Link>
			)}
			{booking.accepted &&
				booking.editable === false &&
				booking.status !== "CONFIRMED" &&
				booking.status !== "DECLINED" && (
					<p className="max-w-3xl rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
						{t("waitingStudioHint")}
					</p>
				)}
			<div className="grid max-w-4xl gap-4">
				<BookingReadonly booking={booking} showClientPart={!booking.editable} />
				{booking.editable && (
					<>
						<ClientBookingForm booking={booking} />
						<ClientBookingAnswer
							bookingId={booking.id}
							incomplete={incomplete}
						/>
					</>
				)}
			</div>
		</>
	);
}
