"use client";

import { Check, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import {
	deleteEquipmentBooking,
	markEquipmentReturned,
} from "@/services/equipment/booking-actions";
import type { EquipmentBookingItem } from "@/services/equipment/types";
import { formatMoney } from "@/services/projects/money";

interface BookingRowsProps {
	bookings: EquipmentBookingItem[];
	/** What each row names: the item (on a project) or the use (on an item). */
	show: "equipment" | "use";
}

/** Bookings with their dates; each can be marked as returned or removed. */
export function BookingRows({ bookings, show }: BookingRowsProps) {
	const t = useTranslations("Equipment.booking");
	const tKind = useTranslations("Equipment.kinds");
	const format = useFormatter();
	const locale = useLocale();
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();
	const today = new Date().toISOString().slice(0, 10);

	const run = (
		action: () => Promise<{ ok: boolean; error?: string }>,
		done: string,
	) =>
		startTransition(async () => {
			const result = await action();
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(done);
			router.refresh();
		});

	return (
		<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
			{bookings.map((booking) => {
				const ref = { equipmentId: booking.equipmentId, bookingId: booking.id };
				const started = booking.startDate.slice(0, 10) <= today;
				const title =
					show === "equipment" ? (
						<Link
							href={`/dashboard/equipment/${booking.equipmentId}`}
							className="hover:underline"
						>
							{booking.equipmentName}
						</Link>
					) : booking.project ? (
						<Link
							href={`/dashboard/projects/${booking.project.id}`}
							className="hover:underline"
						>
							{booking.project.title}
						</Link>
					) : (
						tKind(booking.kind)
					);
				return (
					<li key={booking.id} className="flex items-center gap-3 px-3 py-2">
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium">{title}</p>
							<p className="truncate text-xs text-muted-foreground">
								{format.dateTimeRange(
									new Date(booking.startDate),
									new Date(booking.endDate),
									{ dateStyle: "medium", timeZone: "UTC" },
								)}
								{show === "use" &&
									booking.project &&
									` · ${tKind(booking.kind)}`}
								{booking.partyName && ` · ${booking.partyName}`}
								{booking.amount !== null &&
									` · ${formatMoney(booking.amount, locale)}`}
								{booking.returnedAt && ` · ${t("returned")}`}
							</p>
						</div>
						{started && !booking.returnedAt && booking.kind !== "RENTAL_IN" && (
							<Button
								size="sm"
								variant="outline"
								className="h-7 gap-1 text-xs"
								disabled={isPending}
								onClick={() =>
									run(() => markEquipmentReturned(ref), t("markedReturned"))
								}
							>
								<Check className="h-3.5 w-3.5" />
								{t("markReturned")}
							</Button>
						)}
						<Button
							size="icon"
							variant="ghost"
							className="h-7 w-7 text-muted-foreground hover:text-destructive"
							aria-label={t("remove")}
							disabled={isPending}
							onClick={() =>
								run(() => deleteEquipmentBooking(ref), t("removed"))
							}
						>
							{isPending ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Trash2 className="h-3.5 w-3.5" />
							)}
						</Button>
					</li>
				);
			})}
		</ul>
	);
}
