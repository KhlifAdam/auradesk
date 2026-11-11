"use client";

import { CalendarRange, Check, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";
import {
	deleteEquipmentBooking,
	markEquipmentReturned,
} from "@/services/equipment/booking-actions";
import type { EquipmentBookingItem } from "@/services/equipment/types";
import { formatMoney } from "@/services/projects/money";

/** One colour per group of bookings sharing days, so the group reads at once. */
const SHARED_TONES = [
	"border-l-event-meeting bg-event-meeting/5",
	"border-l-primary bg-primary/5",
	"border-l-event-other bg-event-other/5",
	"border-l-success bg-success/5",
];

const day = (iso: string) => iso.slice(0, 10);

/**
 * Bookings whose days overlap, grouped: each booking gets its group number
 * and the others it shares days with. Bookings alone get nothing.
 */
function sharedDays(bookings: EquipmentBookingItem[]) {
	const sorted = [...bookings].sort((a, b) =>
		day(a.startDate).localeCompare(day(b.startDate)),
	);
	// Chains of bookings whose days run into each other.
	const clusters: EquipmentBookingItem[][] = [];
	let end = "";
	for (const booking of sorted) {
		const last = clusters.at(-1);
		if (last && day(booking.startDate) <= end) {
			last.push(booking);
			if (day(booking.endDate) > end) end = day(booking.endDate);
		} else {
			clusters.push([booking]);
			end = day(booking.endDate);
		}
	}
	const group = new Map<string, number>();
	clusters
		.filter((cluster) => cluster.length > 1)
		.forEach((cluster, index) => {
			for (const booking of cluster) group.set(booking.id, index);
		});
	const overlapping = (a: EquipmentBookingItem, b: EquipmentBookingItem) =>
		day(a.startDate) <= day(b.endDate) && day(b.startDate) <= day(a.endDate);
	return (booking: EquipmentBookingItem) => {
		const index = group.get(booking.id);
		if (index === undefined) return null;
		return {
			tone: SHARED_TONES[index % SHARED_TONES.length],
			with: bookings.filter(
				(b) => b.id !== booking.id && overlapping(b, booking),
			),
		};
	};
}

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
	const sharedOf = sharedDays(bookings);
	// What another booking is called in the "same days" hint.
	const name = (other: EquipmentBookingItem) =>
		show === "equipment"
			? other.equipmentName
			: (other.project?.title ?? tKind(other.kind));

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
				const shared = sharedOf(booking);
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
					<li
						key={booking.id}
						className={cn(
							"flex items-center gap-3 border-l-4 border-l-transparent px-3 py-2",
							shared?.tone,
						)}
					>
						<div className="min-w-0 flex-1">
							<p className="flex items-center gap-2 truncate text-sm font-medium">
								<span className="truncate">{title}</span>
								{shared && (
									<span
										className="inline-flex shrink-0 items-center gap-1 rounded-full bg-event-meeting/15 px-2 py-0.5 text-[10px] font-medium text-event-meeting"
										title={shared.with.map(name).join(", ")}
									>
										<CalendarRange className="h-3 w-3" />
										{t("sameDays", { count: shared.with.length })}
									</span>
								)}
							</p>
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
