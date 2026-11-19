"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { renewSubscription } from "@/services/billing/checkout-actions";
import { goToPayment } from "./go-to-payment";

/**
 * Pays the next period on the secure payment page. Only shown once the
 * renewal is due; the server checks it again.
 */
export function RenewButton({
	label,
	compact = false,
}: {
	label: string;
	compact?: boolean;
}) {
	const t = useTranslations("Billing.checkout");
	const errorMessage = useErrorMessage();
	const [pending, setPending] = useState(false);

	async function renew() {
		setPending(true);
		const result = await renewSubscription();
		if (!result.ok) {
			setPending(false);
			return void toast.error(errorMessage(result.error));
		}
		goToPayment(result.data.payUrl, t("redirecting"));
	}

	return (
		<Button
			type="button"
			size="sm"
			variant={compact ? "outline" : "default"}
			className={compact ? "h-7 px-2.5 text-[11px]" : "h-8 text-xs"}
			onClick={renew}
			disabled={pending}
		>
			{pending ? (
				<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
			) : (
				<CreditCard className="mr-1.5 h-3.5 w-3.5" />
			)}
			{label}
		</Button>
	);
}
