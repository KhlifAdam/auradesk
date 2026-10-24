"use client";

import { Banknote, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
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
import { recordPayment } from "@/services/billing/actions";

/** Records a payment received outside the app; asks first. */
export function RecordPaymentButton({
	userId,
	summary,
}: {
	userId: string;
	/** Plan, billing and amount, e.g. "Pro · Monthly · 36 DT". */
	summary: string;
}) {
	const t = useTranslations("Admin.billing");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();

	const record = () =>
		startTransition(async () => {
			const result = await recordPayment({ userId });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("recorded"));
			router.refresh();
		});

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button size="sm" className="h-7 gap-1.5 text-xs" disabled={isPending}>
					{isPending ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<Banknote className="h-3.5 w-3.5" />
					)}
					{t("record")}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("confirmDescription", { summary })}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction onClick={record}>{t("confirm")}</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
