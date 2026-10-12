import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EquipmentForm } from "@/components/dashboard/equipment/equipment-form";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { emptyEquipmentValues } from "@/services/equipment/form-values";

export default async function NewEquipmentPage() {
	const t = await getTranslations("Equipment.form");

	return (
		<PageShell>
			<Link
				href="/dashboard/equipment"
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("back")}
			</Link>
			<PageHeader title={t("createTitle")} description={t("description")} />
			<EquipmentForm initial={emptyEquipmentValues()} />
		</PageShell>
	);
}
