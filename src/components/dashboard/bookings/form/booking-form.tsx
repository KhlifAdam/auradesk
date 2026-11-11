"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { InvoiceItemsSection } from "@/components/dashboard/invoices/form/invoice-items-section";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { createBooking, updateBooking } from "@/services/bookings/actions";
import { canSaveBooking } from "@/services/bookings/completeness";
import {
	type BookingValues,
	bookingFormSchema,
} from "@/services/bookings/schemas";
import { computeTotals } from "@/services/invoices/totals";
import { BookingClientSection } from "./booking-client-section";
import { BookingFormAside } from "./booking-form-aside";
import { BookingNeedSection } from "./booking-need-section";
import { BookingQuoteSection } from "./booking-quote-section";
import { BookingSteps } from "./booking-steps";

/** What step 1 holds; they are checked before moving on to the quote. */
const REQUEST_FIELDS = [
	"title",
	"source",
	"clientName",
	"clientEmail",
	"clientPhone",
	"serviceType",
	"mediaType",
	"description",
	"desiredDate",
	"startTime",
	"durationHours",
	"location",
] as const;

interface BookingFormProps {
	initial: BookingValues;
	/** Edit mode when set. */
	bookingId?: string;
}

export function BookingForm({ initial, bookingId }: BookingFormProps) {
	const t = useTranslations("Bookings.form");
	const tService = useTranslations("Projects.serviceTypes");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const form = useForm<BookingValues>({
		resolver: zodResolver(
			bookingFormSchema(bookingId ? initial.desiredDate : ""),
		),
		defaultValues: initial,
	});
	const [step, setStep] = useState<1 | 2>(1);
	const [items, discount, taxRate] = useWatch({
		control: form.control,
		name: ["items", "discount", "taxRate"],
	});
	// The price is the total of the quote lines, never typed on its own.
	const total = computeTotals(items ?? [], discount, taxRate).total;
	useEffect(() => {
		form.setValue("proposedPrice", total > 0 ? total : null);
	}, [total, form]);

	async function next() {
		if (!(await form.trigger(REQUEST_FIELDS))) return;
		// The first line names the service sold (the title if one was typed),
		// never the client: they are already on the quote.
		const values = form.getValues();
		if (values.items[0] && !values.items[0].description)
			form.setValue(
				"items.0.description",
				values.title || tService(values.serviceType),
			);
		setStep(2);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	const cancelHref = bookingId
		? `/dashboard/bookings/${bookingId}`
		: "/dashboard/bookings";

	async function onSubmit(values: BookingValues) {
		// Same rule as the Save button, in case the form is sent with Enter.
		if (!canSaveBooking(values)) return void toast.error(t("blockedHint"));
		if (bookingId) {
			const result = await updateBooking({ ...values, id: bookingId });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("updated"));
			router.push(cancelHref);
			return router.refresh();
		}
		const result = await createBooking(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("created"));
		router.push(`/dashboard/bookings/${result.data.id}`);
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]"
			>
				<div className="flex flex-col gap-4">
					<BookingSteps
						step={step}
						onStep={(to) => (to === 1 ? setStep(1) : next())}
					/>
					{step === 1 ? (
						<>
							<BookingClientSection />
							<BookingNeedSection />
						</>
					) : (
						<>
							{/* Every cost as a line: package, drone, reel, travel. */}
							<InvoiceItemsSection />
							<BookingQuoteSection />
						</>
					)}
				</div>
				<BookingFormAside
					cancelHref={cancelHref}
					submitLabel={bookingId ? t("save") : t("create")}
					step={step}
					onNext={next}
					onBack={() => setStep(1)}
				/>
			</form>
		</Form>
	);
}
