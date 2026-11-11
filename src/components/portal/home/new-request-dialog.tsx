"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DurationPresets } from "@/components/dashboard/bookings/form/duration-presets";
import {
	SelectField,
	TextField,
} from "@/components/dashboard/shared/form-fields";
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
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { requestBookingFromPortal } from "@/services/bookings/portal-request-action";
import {
	type PortalRequestValues,
	portalRequestSchema,
} from "@/services/bookings/schemas";
import { MEDIA_TYPES, SERVICE_CHOICES } from "@/services/projects/options";

interface NewRequestDialogProps {
	studios: { photographerId: string; name: string }[];
}

/** Ask a studio the client already works with for a new service. */
export function NewRequestDialog({ studios }: NewRequestDialogProps) {
	const t = useTranslations("Portal.request");
	const tService = useTranslations("Projects.serviceTypes");
	const tMedia = useTranslations("Projects.mediaTypes");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [open, setOpen] = useState(false);
	const empty: PortalRequestValues = {
		photographerId: studios[0]?.photographerId ?? "",
		serviceType: "PORTRAIT",
		mediaType: "PHOTO",
		desiredDate: "",
		startTime: "",
		durationHours: null,
		location: "",
		clientBudget: null,
		plannedAdvance: null,
		message: "",
	};
	const form = useForm<PortalRequestValues>({
		resolver: zodResolver(portalRequestSchema),
		defaultValues: empty,
	});
	const { isSubmitting } = form.formState;

	async function onSubmit(values: PortalRequestValues) {
		const result = await requestBookingFromPortal(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("sent"));
		setOpen(false);
		router.push(`/portal/bookings/${result.data.id}`);
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) form.reset(empty);
			}}
		>
			<DialogTrigger asChild>
				<Button size="sm" className="h-8 gap-1.5 text-xs">
					<CalendarPlus className="h-3.5 w-3.5" />
					{t("action")}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-3"
					>
						{studios.length > 1 && (
							<SelectField<PortalRequestValues>
								name="photographerId"
								label={t("studio")}
								options={studios.map((studio) => ({
									value: studio.photographerId,
									label: studio.name,
								}))}
							/>
						)}
						<div className="grid grid-cols-2 gap-3">
							<SelectField<PortalRequestValues>
								name="serviceType"
								label={t("service")}
								options={SERVICE_CHOICES.map((value) => ({
									value,
									label: tService(value),
								}))}
							/>
							<SelectField<PortalRequestValues>
								name="mediaType"
								label={t("media")}
								options={MEDIA_TYPES.map((value) => ({
									value,
									label: tMedia(value),
								}))}
							/>
						</div>
						<div className="grid items-start gap-3 sm:grid-cols-3">
							<TextField<PortalRequestValues>
								name="desiredDate"
								label={t("date")}
								type="date"
							/>
							<TextField<PortalRequestValues>
								name="startTime"
								label={t("startTime")}
								type="time"
							/>
							<div className="flex flex-col gap-1.5">
								<TextField<PortalRequestValues>
									name="durationHours"
									label={t("duration")}
									type="number"
									step="0.5"
									min={1}
								/>
								<DurationPresets />
							</div>
						</div>
						<TextField<PortalRequestValues>
							name="location"
							label={t("location")}
							description={t("locationHint")}
						/>
						<div className="grid gap-3 sm:grid-cols-2">
							<TextField<PortalRequestValues>
								name="clientBudget"
								label={t("budget")}
								description={t("budgetHint")}
								type="number"
								step="any"
							/>
							<TextField<PortalRequestValues>
								name="plannedAdvance"
								label={t("advance")}
								description={t("advanceHint")}
								type="number"
								step="any"
							/>
						</div>
						<TextField<PortalRequestValues>
							name="message"
							label={t("message")}
							placeholder={t("messagePlaceholder")}
							rows={4}
						/>
						<DialogFooter>
							<Button type="submit" size="sm" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								)}
								{t("send")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
