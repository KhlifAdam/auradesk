"use client";

import { Ban, Loader2, Pencil, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDeleteButton } from "@/components/dashboard/shared/confirm-delete-button";
import { PrintButton } from "@/components/invoices/print-button";
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
import { deleteInvoice } from "@/services/invoices/actions";
import type { InvoiceStatus } from "@/services/invoices/options";
import { cancelInvoice, sendInvoice } from "@/services/invoices/status-actions";
import { PaymentDialog } from "./payment-dialog";

interface InvoiceActionsProps {
	invoiceId: string;
	status: InvoiceStatus;
	balance: number;
}

/** What can be done with the invoice now, depending on its status. */
export function InvoiceActions({
	invoiceId,
	status,
	balance,
}: InvoiceActionsProps) {
	const t = useTranslations("Invoices.detail");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();

	const send = () =>
		startTransition(async () => {
			const result = await sendInvoice(invoiceId);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(result.data.emailed ? t("sentEmailed") : t("sent"));
			router.refresh();
		});

	const cancel = () =>
		startTransition(async () => {
			const result = await cancelInvoice(invoiceId);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("cancelled"));
			router.refresh();
		});

	const editable = status === "DRAFT" || status === "SENT";

	return (
		<div className="flex flex-wrap items-center gap-2 print:hidden">
			{status === "DRAFT" && (
				<>
					<ConfirmDeleteButton
						title={t("deleteTitle")}
						description={t("deleteDescription")}
						onConfirm={async () => {
							const result = await deleteInvoice(invoiceId);
							if (!result.ok)
								return void toast.error(errorMessage(result.error));
							toast.success(t("deleted"));
							router.push("/dashboard/invoices");
						}}
					/>
					<Button
						size="sm"
						className="h-7 gap-1.5 text-xs"
						onClick={send}
						disabled={isPending}
					>
						{isPending ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Send className="h-3.5 w-3.5" />
						)}
						{t("send")}
					</Button>
				</>
			)}
			{status === "SENT" && (
				<PaymentDialog invoiceId={invoiceId} balance={balance} />
			)}
			{(status === "SENT" || status === "PAID") && (
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							size="sm"
							variant="ghost"
							className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
							disabled={isPending}
						>
							<Ban className="h-3.5 w-3.5" />
							{t("cancel")}
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{t("cancelTitle")}</AlertDialogTitle>
							<AlertDialogDescription>
								{t("cancelDescription")}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>{t("keep")}</AlertDialogCancel>
							<AlertDialogAction
								onClick={cancel}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								{t("confirmCancel")}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
			{editable && (
				<Button
					asChild
					size="sm"
					variant="outline"
					className="h-7 gap-1.5 text-xs"
				>
					<Link href={`/dashboard/invoices/${invoiceId}/edit`}>
						<Pencil className="h-3.5 w-3.5" />
						{t("edit")}
					</Link>
				</Button>
			)}
			<PrintButton />
		</div>
	);
}
