"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { createBooking, updateBooking } from "@/services/bookings/actions";
import { canSaveBooking } from "@/services/bookings/completeness";
import { type BookingValues, bookingSchema } from "@/services/bookings/schemas";
import { BookingClientSection } from "./booking-client-section";
import { BookingFormAside } from "./booking-form-aside";
import { BookingNeedSection } from "./booking-need-section";
import { BookingQuoteSection } from "./booking-quote-section";

interface BookingFormProps {
	initial: BookingValues;
	/** Edit mode when set. */
	bookingId?: string;
}

export function BookingForm({ initial, bookingId }: BookingFormProps) {
	const t = useTranslations("Bookings.form");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const form = useForm<BookingValues>({
		resolver: zodResolver(bookingSchema),
		defaultValues: initial,
	});
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
					<BookingClientSection />
					<BookingNeedSection />
					<BookingQuoteSection />
				</div>
				<BookingFormAside
					cancelHref={cancelHref}
					submitLabel={bookingId ? t("save") : t("create")}
				/>
			</form>
		</Form>
	);
}
