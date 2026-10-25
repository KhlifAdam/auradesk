"use client";

import { Banknote, Loader2, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { OrderTimeline } from "@/components/books/order-timeline";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { type BookStatus, ORDER_STATUSES } from "@/services/books/types";
import {
	PAYMENT_METHODS,
	type PaymentMethod,
} from "@/services/invoices/options";
import { OrderActionsPanel } from "./order-actions-panel";
import { type AdvanceTo, useOrderAdvance } from "./use-order-advance";

interface Props {
	bookId: string;
	status: BookStatus;
	calculated: number;
	invoicePaid: boolean;
	/** What is still owed, shown when asking at delivery. */
	balance: string;
}

const ADVANCES: readonly string[] = ORDER_STATUSES.slice(2);

/** The order's steps (clickable), the next action, and the "paid on delivery?" question. */
export function OrderWorkflow({
	bookId,
	status,
	calculated,
	invoicePaid,
	balance,
}: Props) {
	const t = useTranslations("BookOrders.deliver");
	const tMethods = useTranslations("Invoices.methods");
	const flow = useOrderAdvance(bookId, invoicePaid);
	const [method, setMethod] = useState<PaymentMethod>("CASH");

	return (
		<>
			<div className={flow.pending ? "pointer-events-none opacity-60" : ""}>
				<OrderTimeline
					status={status}
					onStep={(step) => {
						if (ADVANCES.includes(step)) flow.advance(step as AdvanceTo);
					}}
				/>
			</div>
			<OrderActionsPanel
				bookId={bookId}
				status={status}
				calculated={calculated}
				invoicePaid={invoicePaid}
				busy={flow.pending}
				onAdvance={flow.advance}
			/>
			<Dialog
				open={flow.askPayment}
				onOpenChange={(o) => !o && flow.closeAsk()}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("title")}</DialogTitle>
						<DialogDescription>
							{t("description", { amount: balance })}
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-wrap gap-1.5">
						{PAYMENT_METHODS.map((m) => (
							<Button
								key={m}
								type="button"
								size="sm"
								variant={method === m ? "default" : "outline"}
								className="h-7 text-xs"
								onClick={() => setMethod(m)}
							>
								{tMethods(m)}
							</Button>
						))}
					</div>
					<DialogFooter className="gap-2 sm:justify-between">
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={flow.pending}
							onClick={() => flow.deliver()}
						>
							<Truck className="h-3.5 w-3.5" />
							{t("unpaid")}
						</Button>
						<Button
							type="button"
							size="sm"
							disabled={flow.pending}
							onClick={() => flow.deliver(method)}
						>
							{flow.pending ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Banknote className="h-3.5 w-3.5" />
							)}
							{t("paid", { amount: balance })}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
