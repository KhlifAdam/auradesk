"use client";

import { Check, Loader2, RotateCcw, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SegmentedControl } from "@/components/dashboard/shared/segmented-control";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { confirmBooking } from "@/services/bookings/confirm";
import {
	type BookingStatus,
	isOpenStatus,
	OPEN_STATUSES,
	type OpenStatus,
} from "@/services/bookings/options";
import { sendBookingToClient } from "@/services/bookings/send-action";
import {
	declineBooking,
	reopenBooking,
	setBookingStatus,
} from "@/services/bookings/status-actions";
import { DeclineDialog } from "./decline-dialog";

interface BookingActionsBarProps {
	bookingId: string;
	status: BookingStatus;
	/** The project already made from this booking, if any. */
	hasProject: boolean;
	/** The date or the proposed price is still missing. */
	blocked: boolean;
	/** The request already went to the client once. */
	sentToClient: boolean;
	/** There is an email or a phone number to send it to. */
	canSend: boolean;
}

/** Moves the request along its commercial steps, then confirms or closes it. */
export function BookingActionsBar({
	bookingId,
	status,
	hasProject,
	blocked,
	sentToClient,
	canSend,
}: BookingActionsBarProps) {
	const t = useTranslations("Bookings.actions");
	const tStatus = useTranslations("Bookings.status");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();
	const [reason, setReason] = useState("");

	function run<T>(
		task: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>,
		done: (data: T) => void,
	) {
		startTransition(async () => {
			const result = await task();
			if (!result.ok) return void toast.error(errorMessage(result.error));
			done(result.data);
			router.refresh();
		});
	}

	if (status === "CONFIRMED" || status === "DECLINED") {
		return (
			<div className="flex flex-wrap items-center gap-2">
				{status === "DECLINED" && !hasProject && (
					<Button
						variant="outline"
						size="sm"
						className="h-8 gap-1.5 text-xs"
						disabled={isPending}
						onClick={() =>
							run(
								() => reopenBooking(bookingId),
								() => toast.success(t("reopened")),
							)
						}
					>
						<RotateCcw className="h-3.5 w-3.5" />
						{t("reopen")}
					</Button>
				)}
				{status === "CONFIRMED" && (
					<DeclineDialog
						title={t("cancelTitle")}
						description={t("cancelDescription")}
						trigger={t("cancel")}
						reason={reason}
						onReason={setReason}
						disabled={isPending}
						onConfirm={() =>
							run(
								() => declineBooking({ id: bookingId, reason }),
								() => toast.success(t("cancelled")),
							)
						}
					/>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<SegmentedControl<OpenStatus>
				value={isOpenStatus(status) ? status : "NEW"}
				onChange={(next) =>
					!isPending &&
					run(
						() => setBookingStatus({ id: bookingId, status: next }),
						() => toast.success(t("statusUpdated")),
					)
				}
				options={OPEN_STATUSES.map((value) => ({
					value,
					label: tStatus(value),
				}))}
			/>
			<Button
				size="sm"
				variant="outline"
				className="h-8 gap-1.5 text-xs"
				disabled={isPending || !canSend}
				title={canSend ? undefined : t("sendNoContact")}
				onClick={() =>
					run(
						() => sendBookingToClient(bookingId),
						(data) =>
							data.notified
								? toast.success(t("sentToClient"))
								: toast.warning(t("sentNotNotified")),
					)
				}
			>
				<Send className="h-3.5 w-3.5" />
				{sentToClient ? t("sendAgain") : t("send")}
			</Button>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button
						size="sm"
						className="h-8 gap-1.5 text-xs"
						disabled={isPending || blocked}
						title={blocked ? t("confirmBlocked") : undefined}
					>
						<Check className="h-3.5 w-3.5" />
						{t("confirm")}
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("confirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("back")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								run(
									() => confirmBooking(bookingId),
									(data) => {
										if (data.invite === "sent") toast.success(t("confirmed"));
										else if (data.invite === "none")
											toast.success(t("confirmedNoContact"));
										else toast.warning(t("confirmedNoEmail"));
										router.push(`/dashboard/projects/${data.projectId}`);
									},
								)
							}
						>
							{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{t("confirmAction")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<DeclineDialog
				title={t("declineTitle")}
				description={t("declineDescription")}
				trigger={t("decline")}
				reason={reason}
				onReason={setReason}
				disabled={isPending}
				onConfirm={() =>
					run(
						() => declineBooking({ id: bookingId, reason }),
						() => toast.success(t("declined")),
					)
				}
			/>
		</div>
	);
}
