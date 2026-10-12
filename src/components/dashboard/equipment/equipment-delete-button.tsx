"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmDeleteButton } from "@/components/dashboard/shared/confirm-delete-button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { deleteEquipment } from "@/services/equipment/actions";

export function EquipmentDeleteButton({
	equipmentId,
}: {
	equipmentId: string;
}) {
	const t = useTranslations("Equipment.detail");
	const router = useRouter();
	const errorMessage = useErrorMessage();

	return (
		<ConfirmDeleteButton
			title={t("deleteTitle")}
			description={t("deleteDescription")}
			onConfirm={async () => {
				const result = await deleteEquipment(equipmentId);
				if (!result.ok) return void toast.error(errorMessage(result.error));
				toast.success(t("deleted"));
				router.push("/dashboard/equipment");
			}}
		/>
	);
}
