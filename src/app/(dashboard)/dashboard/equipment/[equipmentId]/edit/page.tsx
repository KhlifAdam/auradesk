import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EquipmentForm } from "@/components/dashboard/equipment/equipment-form";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { equipmentToValues } from "@/services/equipment/form-values";
import { getEquipment } from "@/services/equipment/queries";

export default async function EditEquipmentPage({
	params,
}: {
	params: Promise<{ equipmentId: string }>;
}) {
	const t = await getTranslations("Equipment.form");
	const { equipmentId } = await params;
	const { photographerId } = await requirePhotographer();
	const item = await getEquipment(photographerId, equipmentId);
	if (!item) notFound();

	return (
		<PageShell>
			<Link
				href={`/dashboard/equipment/${item.id}`}
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("backToItem")}
			</Link>
			<PageHeader
				title={t("editTitle", { name: item.name })}
				description={t("description")}
			/>
			<EquipmentForm initial={equipmentToValues(item)} equipmentId={item.id} />
		</PageShell>
	);
}
