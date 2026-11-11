"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	SelectField,
	TextField,
} from "@/components/dashboard/shared/form-fields";
import { FormSection } from "@/components/dashboard/shared/form-section";
import {
	FORM_WITH_SIDE,
	FormSideActions,
} from "@/components/dashboard/shared/form-side-actions";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { createEquipment, updateEquipment } from "@/services/equipment/actions";
import {
	EQUIPMENT_CATEGORIES,
	EQUIPMENT_OWNERSHIPS,
	EQUIPMENT_STATUSES,
} from "@/services/equipment/options";
import {
	type EquipmentValues,
	equipmentSchema,
} from "@/services/equipment/schemas";
import { CURRENCY } from "@/services/projects/options";

interface EquipmentFormProps {
	initial: EquipmentValues;
	/** Edit mode when set. */
	equipmentId?: string;
}

export function EquipmentForm({ initial, equipmentId }: EquipmentFormProps) {
	const t = useTranslations("Equipment.form");
	const tCategory = useTranslations("Equipment.categories");
	const tStatus = useTranslations("Equipment.statuses");
	const tOwnership = useTranslations("Equipment.ownerships");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const form = useForm<EquipmentValues>({
		resolver: zodResolver(equipmentSchema),
		defaultValues: initial,
	});
	const { isSubmitting } = form.formState;
	const backHref = equipmentId
		? `/dashboard/equipment/${equipmentId}`
		: "/dashboard/equipment";

	async function onSubmit(values: EquipmentValues) {
		const result = equipmentId
			? await updateEquipment({ ...values, id: equipmentId })
			: await createEquipment(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(equipmentId ? t("updated") : t("created"));
		const id = equipmentId ?? (result.data as { id: string }).id;
		router.push(`/dashboard/equipment/${id}`);
		router.refresh();
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className={FORM_WITH_SIDE}>
				<div className="flex flex-col gap-4">
					<FormSection title={t("item.title")}>
						<div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
							<TextField<EquipmentValues>
								name="name"
								label={t("item.name")}
								placeholder={t("item.namePlaceholder")}
								required
							/>
							<SelectField<EquipmentValues>
								name="category"
								label={t("item.category")}
								options={EQUIPMENT_CATEGORIES.map((value) => ({
									value,
									label: tCategory(value),
								}))}
							/>
						</div>
						<div className="grid gap-3 sm:grid-cols-3">
							<TextField<EquipmentValues>
								name="brand"
								label={t("item.brand")}
							/>
							<TextField<EquipmentValues>
								name="model"
								label={t("item.model")}
							/>
							<TextField<EquipmentValues>
								name="serialNumber"
								label={t("item.serialNumber")}
							/>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<SelectField<EquipmentValues>
								name="status"
								label={t("item.status")}
								description={t("item.statusHint")}
								options={EQUIPMENT_STATUSES.map((value) => ({
									value,
									label: tStatus(value),
								}))}
							/>
							<SelectField<EquipmentValues>
								name="ownership"
								label={t("item.ownership")}
								options={EQUIPMENT_OWNERSHIPS.map((value) => ({
									value,
									label: tOwnership(value),
								}))}
							/>
						</div>
					</FormSection>
					<FormSection
						title={t("money.title")}
						description={t("money.hint", { currency: CURRENCY })}
					>
						<div className="grid gap-3 sm:grid-cols-3">
							<TextField<EquipmentValues>
								name="purchaseDate"
								label={t("money.purchaseDate")}
								type="date"
							/>
							<TextField<EquipmentValues>
								name="purchasePrice"
								label={t("money.purchasePrice")}
								type="number"
								step="any"
							/>
							<TextField<EquipmentValues>
								name="dailyRate"
								label={t("money.dailyRate")}
								description={t("money.dailyRateHint")}
								type="number"
								step="any"
							/>
						</div>
						<TextField<EquipmentValues>
							name="notes"
							label={t("money.notes")}
							rows={3}
						/>
					</FormSection>
				</div>
				<FormSideActions
					cancelHref={backHref}
					cancelLabel={t("cancel")}
					submitLabel={equipmentId ? t("save") : t("create")}
					submitting={isSubmitting}
				/>
			</form>
		</Form>
	);
}
