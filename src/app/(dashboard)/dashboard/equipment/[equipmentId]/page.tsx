import { ArrowLeft, CalendarRange, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AvailabilityBadge } from "@/components/dashboard/equipment/availability-badge";
import { BookingDialog } from "@/components/dashboard/equipment/booking-dialog";
import { BookingRows } from "@/components/dashboard/equipment/booking-rows";
import { EquipmentDeleteButton } from "@/components/dashboard/equipment/equipment-delete-button";
import { EquipmentFacts } from "@/components/dashboard/equipment/equipment-facts";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import {
	getEquipment,
	listEquipmentBookings,
} from "@/services/equipment/queries";
import { equipmentPageSchema } from "@/services/equipment/schemas";

interface EquipmentItemPageProps {
	params: Promise<{ equipmentId: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EquipmentItemPage({
	params,
	searchParams,
}: EquipmentItemPageProps) {
	const t = await getTranslations("Equipment.detail");
	const { equipmentId } = await params;
	const { page } = equipmentPageSchema.parse(await searchParams);
	const { photographerId } = await requirePhotographer();
	const item = await getEquipment(photographerId, equipmentId);
	if (!item) notFound();
	const bookings = await listEquipmentBookings(photographerId, item.id, page);

	return (
		<PageShell>
			<Link
				href="/dashboard/equipment"
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("back")}
			</Link>
			<PageHeader
				title={item.name}
				actions={
					<>
						<AvailabilityBadge availability={item.availability} />
						<EquipmentDeleteButton equipmentId={item.id} />
						<Button
							asChild
							size="sm"
							variant="outline"
							className="h-7 gap-1.5 text-xs"
						>
							<Link href={`/dashboard/equipment/${item.id}/edit`}>
								<Pencil className="h-3.5 w-3.5" />
								{t("edit")}
							</Link>
						</Button>
					</>
				}
			/>
			<EquipmentFacts item={item} />
			<section className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold">{t("bookings")}</h2>
					{item.status === "ACTIVE" && <BookingDialog equipmentId={item.id} />}
				</div>
				{bookings.items.length === 0 ? (
					<EmptyState
						icon={CalendarRange}
						title={t("noBookings")}
						description={t("noBookingsHint")}
					/>
				) : (
					<>
						<BookingRows bookings={bookings.items} show="use" />
						<UrlPagination
							page={bookings.page}
							pageCount={bookings.pageCount}
						/>
					</>
				)}
			</section>
		</PageShell>
	);
}
