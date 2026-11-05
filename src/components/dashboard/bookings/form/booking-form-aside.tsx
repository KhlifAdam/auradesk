"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";
import { Item } from "@/components/dashboard/bookings/booking-checklist";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	bookingCompleteness,
	canSaveBooking,
} from "@/services/bookings/completeness";
import type { BookingValues } from "@/services/bookings/schemas";

const REQUIRED = [
	"desiredDate",
	"startTime",
	"location",
	"clientEmail",
	"clientPhone",
	"proposedPrice",
] as const;

interface BookingFormAsideProps {
	cancelHref: string;
	submitLabel: string;
}

/** What is still missing (live, as the form is filled) and the form's buttons. */
export function BookingFormAside({
	cancelHref,
	submitLabel,
}: BookingFormAsideProps) {
	const t = useTranslations("Bookings.checklist");
	const tForm = useTranslations("Bookings.form");
	const { control, formState } = useFormContext<BookingValues>();
	const [
		desiredDate,
		proposedPrice,
		clientEmail,
		clientPhone,
		location,
		startTime,
	] = useWatch({
		control,
		name: [
			"desiredDate",
			"proposedPrice",
			"clientEmail",
			"clientPhone",
			"location",
			"startTime",
		],
	});
	const clientName = useWatch({ control, name: "clientName" });
	const completeness = bookingCompleteness({
		desiredDate,
		proposedPrice,
		clientEmail,
		clientPhone,
		location,
		startTime,
	});
	const ready = completeness.required.length === 0;
	const canSubmit = canSaveBooking({ clientName, proposedPrice });

	return (
		<aside className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
			<section
				className={cn(
					"flex flex-col gap-2 rounded-xl border p-3 transition-colors duration-300",
					ready ? "border-success/40 bg-success/5" : "border-border bg-card",
				)}
			>
				<h2 className="text-sm font-semibold">
					{ready ? t("ready") : t("title")}
				</h2>
				<p className="text-xs text-muted-foreground">{tForm("asideHint")}</p>
				<ul className="flex flex-col gap-1.5">
					{REQUIRED.map((field) => (
						<Item
							key={field}
							label={t(`fields.${field}`)}
							tag={t("required")}
							state={completeness.required.includes(field) ? "missing" : "done"}
						/>
					))}
				</ul>
			</section>
			<div className="flex flex-col gap-2">
				<Button
					type="submit"
					size="sm"
					disabled={formState.isSubmitting || !canSubmit}
				>
					{formState.isSubmitting && (
						<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
					)}
					{submitLabel}
				</Button>
				{!canSubmit && (
					<p className="text-center text-xs text-muted-foreground">
						{tForm("blockedHint")}
					</p>
				)}
				<Button asChild type="button" variant="ghost" size="sm">
					<Link href={cancelHref}>{tForm("cancel")}</Link>
				</Button>
			</div>
		</aside>
	);
}
