"use client";

import { CircleCheckBig, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DeclineDialog } from "@/components/dashboard/bookings/decline-dialog";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { answerBooking } from "@/services/bookings/client-actions";

interface ClientBookingAnswerProps {
	bookingId: string;
	/** The studio still has to add the date or the price. */
	incomplete: boolean;
}

/** The two buttons: accept the proposal or decline the request. */
export function ClientBookingAnswer({
	bookingId,
	incomplete,
}: ClientBookingAnswerProps) {
	const t = useTranslations("Portal.bookings.answer");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();
	const [reason, setReason] = useState("");

	const answer = (accept: boolean) =>
		startTransition(async () => {
			const result = await answerBooking({ id: bookingId, accept, reason });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(accept ? t("accepted") : t("declined"));
			router.refresh();
		});

	return (
		<div className="flex flex-col items-stretch gap-2">
			<Button
				className="h-10 gap-2 text-sm font-semibold shadow-md transition-all duration-300 hover:shadow-lg"
				disabled={isPending || incomplete}
				onClick={() => answer(true)}
			>
				{isPending ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<CircleCheckBig className="h-4 w-4" />
				)}
				{t("accept")}
			</Button>
			<DeclineDialog
				title={t("declineTitle")}
				description={t("declineDescription")}
				trigger={t("decline")}
				reason={reason}
				onReason={setReason}
				disabled={isPending}
				onConfirm={() => answer(false)}
			/>
		</div>
	);
}
