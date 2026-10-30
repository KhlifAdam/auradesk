"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { MediaField } from "@/components/dashboard/media/media-field";
import { ConfirmDeleteButton } from "@/components/dashboard/shared/confirm-delete-button";
import {
	SwitchField,
	TextField,
} from "@/components/dashboard/shared/form-fields";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useErrorMessage } from "@/hooks/use-error-message";
import {
	createPackage,
	deletePackage,
	updatePackage,
} from "@/services/packages/actions";
import { type PackageValues, packageSchema } from "@/services/packages/schemas";
import type { PackageItem } from "@/services/packages/types";
import { AmountOrUnlimitedField } from "./amount-or-unlimited-field";
import { DeliverablesInput } from "./deliverables-input";
import { PriceFields } from "./price-fields";

interface PackageFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Edit mode when provided, create mode otherwise. */
	pkg?: PackageItem;
}

const EMPTY: PackageValues = {
	name: "",
	description: "",
	price: 0,
	currency: "TND",
	durationMinutes: null,
	unlimitedDuration: false,
	photoCount: null,
	unlimitedPhotos: false,
	deliverables: [],
	coverMediaId: null,
	active: true,
	featured: false,
};

export function PackageFormSheet({
	open,
	onOpenChange,
	pkg,
}: PackageFormSheetProps) {
	const t = useTranslations("Services.form");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const form = useForm<PackageValues>({
		resolver: zodResolver(packageSchema),
		defaultValues: EMPTY,
	});
	const { isSubmitting } = form.formState;

	useEffect(() => {
		if (!open) return;
		if (!pkg) return form.reset(EMPTY);
		const { id, cover, ...values } = pkg;
		form.reset(values);
	}, [open, pkg, form]);

	async function onSubmit(values: PackageValues) {
		const result = pkg
			? await updatePackage({ ...values, id: pkg.id })
			: await createPackage(values);
		if (!result.ok) return toast.error(errorMessage(result.error));
		toast.success(pkg ? t("updated") : t("created"));
		onOpenChange(false);
		router.refresh();
	}

	async function onDelete() {
		if (!pkg) return;
		const result = await deletePackage(pkg.id);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("deleted"));
		onOpenChange(false);
		router.refresh();
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
				<SheetHeader className="border-b border-border px-5 py-4">
					<SheetTitle>{pkg ? t("editTitle") : t("createTitle")}</SheetTitle>
					<SheetDescription>{t("description")}</SheetDescription>
				</SheetHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex min-h-0 flex-1 flex-col"
					>
						<div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
							<TextField<PackageValues>
								name="name"
								label={t("name")}
								placeholder={t("namePlaceholder")}
							/>
							<TextField<PackageValues>
								name="description"
								label={t("descriptionLabel")}
								rows={3}
							/>
							<PriceFields />
							<AmountOrUnlimitedField
								name="durationMinutes"
								unlimitedName="unlimitedDuration"
								label={t("duration")}
								unit={t("hoursUnit")}
								unlimitedLabel={t("unlimited")}
								hint={t("durationHint")}
								scale={60}
								step={0.5}
							/>
							<AmountOrUnlimitedField
								name="photoCount"
								unlimitedName="unlimitedPhotos"
								label={t("photos")}
								unit={t("photosUnit")}
								unlimitedLabel={t("unlimited")}
								hint={t("photosHint")}
							/>
							<FormField
								control={form.control}
								name="deliverables"
								render={({ field }) => (
									<FormItem className="space-y-1">
										<FormLabel className="text-xs">
											{t("deliverables")}
										</FormLabel>
										<DeliverablesInput
											value={field.value}
											onChange={field.onChange}
										/>
										<FormMessage className="text-xs" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="coverMediaId"
								render={({ field }) => (
									<FormItem className="space-y-1.5">
										<FormLabel className="text-xs">{t("cover")}</FormLabel>
										<MediaField
											value={field.value}
											onChange={field.onChange}
											initialMedia={pkg?.cover ?? null}
										/>
									</FormItem>
								)}
							/>
							<SwitchField<PackageValues>
								name="active"
								label={t("active")}
								description={t("activeHint")}
							/>
							<SwitchField<PackageValues>
								name="featured"
								label={t("featured")}
								description={t("featuredHint")}
							/>
						</div>
						<SheetFooter className="flex-row items-center justify-between border-t border-border px-5 py-3 sm:justify-between">
							{pkg ? (
								<ConfirmDeleteButton
									title={t("deleteTitle")}
									description={t("deleteDescription")}
									onConfirm={onDelete}
								/>
							) : (
								<span />
							)}
							<Button type="submit" size="sm" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								)}
								{pkg ? t("save") : t("create")}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
