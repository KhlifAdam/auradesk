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
	/** Unsaved changes would be lost: they must be saved first. */
	hasUnsavedChanges?: boolean;
}

/** Accept the proposal or decline the request. */
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
		<section
			id="answer"
			className="flex scroll-mt-24 flex-col gap-4 rounded-xl border-2 border-primary/50 bg-primary/5 p-5 shadow-sm"
		>
			<div className="flex flex-col gap-1">
				<h2 className="font-display text-lg font-bold tracking-tight">
					{t("title")}
				</h2>
				<p className="text-sm text-muted-foreground">
					{incomplete ? t("incomplete") : t("hint")}
				</p>
			</div>
			<div className="flex flex-wrap items-center gap-3">
				<Button
					className="h-11 gap-2 px-6 text-sm font-semibold shadow-md transition-all duration-300 hover:shadow-lg"
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
		</section>
	);
}
