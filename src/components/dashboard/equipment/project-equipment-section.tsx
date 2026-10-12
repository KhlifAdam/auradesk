import { Package } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { EquipmentBookingItem } from "@/services/equipment/types";
import { BookingDialog } from "./booking-dialog";
import { BookingRows } from "./booking-rows";

/** The gear booked for a project's shoot, and a way to add more. */
export async function ProjectEquipmentSection({
	projectId,
	eventDate,
	bookings,
}: {
	projectId: string;
	eventDate: string | null;
	bookings: EquipmentBookingItem[];
}) {
	const t = await getTranslations("Equipment.project");

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				<BookingDialog projectId={projectId} projectDate={eventDate} />
			</div>
			{bookings.length === 0 ? (
				<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<Package className="h-3.5 w-3.5" />
					{t("none")}
				</p>
			) : (
				<BookingRows bookings={bookings} show="equipment" />
			)}
		</section>
	);
}
