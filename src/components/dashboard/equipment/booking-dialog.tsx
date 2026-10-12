"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
	SelectField,
	TextField,
} from "@/components/dashboard/shared/form-fields";
import { SearchPicker } from "@/components/dashboard/shared/search-picker";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { createEquipmentBooking } from "@/services/equipment/booking-actions";
import { emptyBookingValues } from "@/services/equipment/form-values";
import { EQUIPMENT_BOOKING_KINDS } from "@/services/equipment/options";
import {
	type EquipmentBookingValues,
	equipmentBookingSchema,
} from "@/services/equipment/schemas";
import {
	findMyEquipment,
	findMyProjects,
} from "@/services/equipment/search-actions";

type Fixed =
	/** From an item's page: the item is set, the use is chosen. */
	| { equipmentId: string; projectId?: never; projectDate?: never }
	/** From a project's page: the project is set, the item is picked. */
	| { projectId: string; projectDate: string | null; equipmentId?: never };

/** Books an item for some days: a shoot, a rental, a repair. */
export function BookingDialog(fixed: Fixed) {
	const t = useTranslations("Equipment.booking");
	const tKind = useTranslations("Equipment.kinds");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [open, setOpen] = useState(false);
	const [labels, setLabels] = useState({ equipment: "", project: "" });
	const fromProject = Boolean(fixed.projectId);
	const defaults = () =>
		emptyBookingValues({
			equipmentId: fixed.equipmentId ?? "",
			projectId: fixed.projectId ?? "",
			...(fixed.projectDate && {
				startDate: fixed.projectDate.slice(0, 10),
				endDate: fixed.projectDate.slice(0, 10),
			}),
		});
	const form = useForm<EquipmentBookingValues>({
		resolver: zodResolver(equipmentBookingSchema),
		defaultValues: defaults(),
	});
	const kind = useWatch({ control: form.control, name: "kind" });
	const { isSubmitting } = form.formState;

	async function onSubmit(values: EquipmentBookingValues) {
		const result = await createEquipmentBooking(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("saved"));
		setOpen(false);
		router.refresh();
	}

	const picker = (
		name: "equipmentId" | "projectId",
		search: typeof findMyEquipment,
	) => (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem className="space-y-1">
					<FormLabel className="text-xs">{t(name)}</FormLabel>
					<SearchPicker
						search={search}
						value={labels[name === "equipmentId" ? "equipment" : "project"]}
						placeholder={t(`${name}Placeholder`)}
						searchPlaceholder={t("search")}
						emptyLabel={t("noMatch")}
						onPick={(option) => {
							field.onChange(option.id);
							setLabels((current) => ({
								...current,
								[name === "equipmentId" ? "equipment" : "project"]:
									option.label,
							}));
						}}
					/>
					<FormMessage className="text-xs" />
				</FormItem>
			)}
		/>
	);

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) {
					form.reset(defaults());
					setLabels({ equipment: "", project: "" });
				}
			}}
		>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
					<CalendarPlus className="h-3.5 w-3.5" />
					{fromProject ? t("addToProject") : t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{fromProject ? t("addToProject") : t("title")}
					</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-3"
					>
						{fromProject ? (
							picker("equipmentId", findMyEquipment)
						) : (
							<SelectField<EquipmentBookingValues>
								name="kind"
								label={t("kind")}
								options={EQUIPMENT_BOOKING_KINDS.map((value) => ({
									value,
									label: tKind(value),
								}))}
							/>
						)}
						{!fromProject &&
							kind === "PROJECT" &&
							picker("projectId", findMyProjects)}
						<div className="grid grid-cols-2 gap-3">
							<TextField<EquipmentBookingValues>
								name="startDate"
								label={t("startDate")}
								type="date"
								required
							/>
							<TextField<EquipmentBookingValues>
								name="endDate"
								label={t("endDate")}
								type="date"
								required
							/>
						</div>
						{kind !== "PROJECT" && (
							<div className="grid grid-cols-2 gap-3">
								<TextField<EquipmentBookingValues>
									name="partyName"
									label={t(kind === "RENTAL_OUT" ? "renter" : "supplier")}
								/>
								<TextField<EquipmentBookingValues>
									name="amount"
									label={t(kind === "RENTAL_OUT" ? "fee" : "cost")}
									type="number"
									step="0.001"
								/>
							</div>
						)}
						<TextField<EquipmentBookingValues>
							name="notes"
							label={t("notes")}
							rows={2}
						/>
						<DialogFooter>
							<Button type="submit" size="sm" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								)}
								{t("save")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
