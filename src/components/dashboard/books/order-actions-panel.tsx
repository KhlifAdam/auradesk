"use client";

import { Check, Loader2, Printer, Truck, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { ActionResult } from "@/lib/action-result";
import {
	acceptBookOrder,
	advanceBookOrder,
	sendBackBookOrder,
} from "@/services/books/studio-order-actions";
import type { BookStatus } from "@/services/books/types";

interface Props {
	bookId: string;
	status: BookStatus;
	/** The price worked out from the studio's list. */
	calculated: number;
	invoicePaid: boolean;
}

/** The next step for an order: accept (or send back), then print, ready, delivered. */
export function OrderActionsPanel({
	bookId,
	status,
	calculated,
	invoicePaid,
}: Props) {
	const t = useTranslations("BookOrders.actions");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [pending, startTransition] = useTransition();
	const [price, setPrice] = useState(String(calculated));
	const [note, setNote] = useState("");
	const [sendingBack, setSendingBack] = useState(false);

	const run = (task: () => Promise<ActionResult<unknown>>, done: string) =>
		startTransition(async () => {
			const result = await task();
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(done);
			setSendingBack(false);
			router.refresh();
		});

	const advance = (to: "IN_PRODUCTION" | "READY" | "DELIVERED", done: string) =>
		run(() => advanceBookOrder({ id: bookId, to }), done);

	const spinner = (icon: React.ReactNode) =>
		pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon;

	if (status === "DELIVERED" || status === "DRAFT")
		return <p className="text-sm text-muted-foreground">{t("done")}</p>;
	const canSendBack = status === "SUBMITTED" || status === "ACCEPTED";

	return (
		<div className="flex flex-col gap-3">
			<p className="text-sm">{t(`hint.${status}`)}</p>
			{status === "SUBMITTED" && (
				<div className="flex flex-wrap items-end gap-2">
					<label
						htmlFor="book-price"
						className="flex flex-col gap-1 text-xs text-muted-foreground"
					>
						{t("price")}
						<Input
							type="number"
							id="book-price"
							min={0}
							step="0.001"
							value={price}
							onChange={(e) => setPrice(e.target.value)}
							className="h-8 w-32"
						/>
					</label>
					<Button
						size="sm"
						className="gap-1.5"
						disabled={pending || price === ""}
						onClick={() =>
							run(
								() =>
									acceptBookOrder({
										id: bookId,
										total: Number(price) === calculated ? null : Number(price),
									}),
								t("accepted"),
							)
						}
					>
						{spinner(<Check className="h-3.5 w-3.5" />)}
						{t("accept")}
					</Button>
				</div>
			)}
			{status === "ACCEPTED" && (
				<div className="flex flex-col gap-1">
					<Button
						size="sm"
						className="w-fit gap-1.5"
						disabled={pending || !invoicePaid}
						onClick={() => advance("IN_PRODUCTION", t("started"))}
					>
						{spinner(<Printer className="h-3.5 w-3.5" />)}
						{t("start")}
					</Button>
					{!invoicePaid && (
						<p className="text-[11px] text-muted-foreground">
							{t("needsPayment")}
						</p>
					)}
				</div>
			)}
			{status === "IN_PRODUCTION" && (
				<Button
					size="sm"
					className="w-fit gap-1.5"
					disabled={pending}
					onClick={() => advance("READY", t("readied"))}
				>
					{spinner(<Check className="h-3.5 w-3.5" />)}
					{t("ready")}
				</Button>
			)}
			{status === "READY" && (
				<Button
					size="sm"
					className="w-fit gap-1.5"
					disabled={pending}
					onClick={() => advance("DELIVERED", t("delivered"))}
				>
					{spinner(<Truck className="h-3.5 w-3.5" />)}
					{t("deliver")}
				</Button>
			)}
			{canSendBack &&
				(sendingBack ? (
					<div className="flex flex-col gap-2">
						<Textarea
							rows={2}
							maxLength={500}
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder={t("notePlaceholder")}
						/>
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="outline"
								disabled={pending || note.trim() === ""}
								onClick={() =>
									run(
										() => sendBackBookOrder({ id: bookId, note }),
										t("sentBack"),
									)
								}
							>
								{spinner(<Undo2 className="h-3.5 w-3.5" />)}
								{t("sendBackConfirm")}
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setSendingBack(false)}
							>
								{t("cancel")}
							</Button>
						</div>
					</div>
				) : (
					<Button
						size="sm"
						variant="ghost"
						className="w-fit gap-1.5 text-muted-foreground"
						onClick={() => setSendingBack(true)}
					>
						<Undo2 className="h-3.5 w-3.5" />
						{t("sendBack")}
					</Button>
				))}
		</div>
	);
}
