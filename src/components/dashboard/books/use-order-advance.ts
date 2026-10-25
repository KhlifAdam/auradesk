"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useErrorMessage } from "@/hooks/use-error-message";
import { setBookPaid } from "@/services/books/book-payment-actions";
import { advanceBookOrder } from "@/services/books/studio-order-actions";
import type { PaymentMethod } from "@/services/invoices/options";

export type AdvanceTo = "IN_PRODUCTION" | "READY" | "DELIVERED";

/**
 * Moving an order on, from the buttons or the timeline. Delivering an unpaid
 * order first asks whether the client paid on the spot, so money is never
 * forgotten at the door.
 */
export function useOrderAdvance(bookId: string, invoicePaid: boolean) {
	const t = useTranslations("BookOrders.actions");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [pending, startTransition] = useTransition();
	const [askPayment, setAskPayment] = useState(false);

	const done = {
		IN_PRODUCTION: t("started"),
		READY: t("readied"),
		DELIVERED: t("delivered"),
	} as const;

	const go = (to: AdvanceTo, collected?: PaymentMethod) =>
		startTransition(async () => {
			if (collected) {
				const paid = await setBookPaid({
					id: bookId,
					paid: true,
					method: collected,
				});
				if (!paid.ok) return void toast.error(errorMessage(paid.error));
			}
			const result = await advanceBookOrder({ id: bookId, to });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			setAskPayment(false);
			toast.success(collected ? t("deliveredPaid") : done[to]);
			router.refresh();
		});

	const advance = (to: AdvanceTo) => {
		if (to === "DELIVERED" && !invoicePaid) setAskPayment(true);
		else go(to);
	};

	return {
		pending,
		advance,
		askPayment,
		closeAsk: () => setAskPayment(false),
		deliver: (collected?: PaymentMethod) => go("DELIVERED", collected),
	};
}
