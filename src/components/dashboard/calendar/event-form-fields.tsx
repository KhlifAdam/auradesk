"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
	SwitchField,
	TextField,
} from "@/components/dashboard/shared/form-fields";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EVENT_TYPES } from "@/services/calendar/constants";
import type { EventFormValues } from "@/services/calendar/schemas";
import type { ProjectOption } from "@/services/calendar/types";
import { EVENT_STYLES } from "./event-styles";

// Radix Select can't hold an empty value.
const NO_PROJECT = "none";

export function EventFormFields({ projects }: { projects: ProjectOption[] }) {
	const t = useTranslations("Calendar.form");
	const tTypes = useTranslations("Calendar.types");
	const { control, getValues, setValue } = useFormContext<EventFormValues>();
	const [allDay, startDate] = useWatch({
		control,
		name: ["allDay", "startDate"],
	});

	// Keep the end on or after the start when the start moves forward.
	useEffect(() => {
		if (startDate && getValues("endDate") < startDate)
			setValue("endDate", startDate);
	}, [startDate, getValues, setValue]);

	return (
		<>
			<FormField
				control={control}
				name="type"
				render={({ field }) => (
					<FormItem className="space-y-1">
						<FormLabel className="text-xs">{t("type")}</FormLabel>
						<div className="flex flex-wrap gap-1.5">
							{/* "Available" is the default state; only shown on old entries. */}
							{EVENT_TYPES.filter(
								(type) => type !== "AVAILABLE" || field.value === type,
							).map((type) => {
								const { icon: Icon, chip } = EVENT_STYLES[type];
								const active = field.value === type;
								return (
									<button
										key={type}
										type="button"
										aria-pressed={active}
										onClick={() => field.onChange(type)}
										className={cn(
											"flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all duration-200",
											active
												? cn(chip, "ring-1 ring-current")
												: "border border-border text-muted-foreground hover:text-foreground",
										)}
									>
										<Icon className="h-3.5 w-3.5" />
										{tTypes(type)}
									</button>
								);
							})}
						</div>
					</FormItem>
				)}
			/>
			<TextField<EventFormValues>
				name="title"
				label={t("title")}
				placeholder={t("titlePlaceholder")}
			/>
			<SwitchField<EventFormValues>
				name="allDay"
				label={t("allDay")}
				description={t("allDayHint")}
			/>
			<div className="grid grid-cols-2 gap-3">
				<TextField<EventFormValues>
					name="startDate"
					label={t("start")}
					type="date"
				/>
				{allDay ? (
					<TextField<EventFormValues>
						name="endDate"
						label={t("end")}
						type="date"
					/>
				) : (
					<TextField<EventFormValues>
						name="startTime"
						label={t("startTime")}
						type="time"
					/>
				)}
				{!allDay && (
					<>
						<TextField<EventFormValues>
							name="endDate"
							label={t("end")}
							type="date"
						/>
						<TextField<EventFormValues>
							name="endTime"
							label={t("endTime")}
							type="time"
						/>
					</>
				)}
			</div>
			<div className="grid grid-cols-2 gap-3">
				<TextField<EventFormValues> name="location" label={t("location")} />
				<FormField
					control={control}
					name="projectId"
					render={({ field }) => (
						<FormItem className="space-y-1">
							<FormLabel className="text-xs">{t("project")}</FormLabel>
							<Select
								value={field.value || NO_PROJECT}
								onValueChange={(value) =>
									field.onChange(value === NO_PROJECT ? "" : value)
								}
							>
								<FormControl>
									<SelectTrigger className="h-8 w-full text-sm">
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={NO_PROJECT}>{t("noProject")}</SelectItem>
									{projects.map((project) => (
										<SelectItem key={project.id} value={project.id}>
											{project.title}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormItem>
					)}
				/>
			</div>
			<TextField<EventFormValues> name="notes" label={t("notes")} rows={3} />
		</>
	);
}
