import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { ForgetPaymentResult } from "./forget-payment-result";

export const PAYMENT_RESULTS = [
	"success",
	"pending",
	"failed",
	"cancelled",
] as const;
export type PaymentResult = (typeof PAYMENT_RESULTS)[number];

const ICONS = {
	success: CheckCircle2,
	pending: Clock,
	failed: XCircle,
	cancelled: XCircle,
} as const;

/** What happened at the gateway, shown once the payer is back (`?payment=`). */
export async function PaymentResultNotice({
	result,
}: {
	result: PaymentResult;
}) {
	const t = await getTranslations("Billing.result");
	const Icon = ICONS[result];
	return (
		<div
			role="status"
			className={cn(
				"flex items-start gap-2.5 rounded-xl border p-3 text-sm",
				result === "success"
					? "border-primary/40 bg-primary/5"
					: result === "pending"
						? "border-border bg-card"
						: "border-destructive/40 bg-destructive/5",
			)}
		>
			<Icon
				className={cn(
					"mt-0.5 h-4 w-4 shrink-0",
					result === "success"
						? "text-primary"
						: result === "pending"
							? "text-muted-foreground"
							: "text-destructive",
				)}
			/>
			<ForgetPaymentResult />
			<div>
				<p className="font-medium">{t(`${result}.title`)}</p>
				<p className="text-xs text-muted-foreground">
					{t(`${result}.description`)}
				</p>
			</div>
		</div>
	);
}
