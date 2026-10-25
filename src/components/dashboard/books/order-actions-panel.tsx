"use client";

import { Check, Info, Loader2, Printer, Truck, Undo2 } from "lucide-react";
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
	sendBackBookOrder,
} from "@/services/books/studio-order-actions";
import type { BookStatus } from "@/services/books/types";
import type { AdvanceTo } from "./use-order-advance";

interface Props {
	bookId: string;
	status: BookStatus;
	/** The price worked out from the studio's list. */
	calculated: number;
	invoicePaid: boolean;
	busy: boolean;
	onAdvance: (to: AdvanceTo) => void;
}

/** The next step for an order: accept (or send back), then print, ready, delivered. */
export function OrderActionsPanel({
	bookId,
	status,
	calculated,
	invoicePaid,
	busy,
	onAdvance,
}: Props) {
	const t = useTranslations("BookOrders.actions");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [running, startTransition] = useTransition();
	const [price, setPrice] = useState(String(calculated));
	const [note, setNote] = useState("");
	const [sendingBack, setSendingBack] = useState(false);
	const pending = running || busy;

	const run = (task: () => Promise<ActionResult<unknown>>, done: string) =>
		startTransition(async () => {
			const result = await task();
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(done);
			setSendingBack(false);
			router.refresh();
		});

	const icon = (node: React.ReactNode) =>
		pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : node;

	if (status === "DELIVERED" || status === "DRAFT")
		return <p className="text-sm text-muted-foreground">{t("done")}</p>;
	const canSendBack = status === "SUBMITTED" || status === "ACCEPTED";
	const step = {
		ACCEPTED: { to: "IN_PRODUCTION", label: t("start"), Icon: Printer },
		IN_PRODUCTION: { to: "READY", label: t("ready"), Icon: Check },
		READY: { to: "DELIVERED", label: t("deliver"), Icon: Truck },
	} as const;
	const next = status === "SUBMITTED" ? null : step[status];

	return (
		<div className="flex flex-col gap-3">
			<p className="text-sm">{t(`hint.${status}`)}</p>
			{status !== "SUBMITTED" && !invoicePaid && (
				<p className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
					<Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
					{t("unpaidNote")}
				</p>
			)}
			{status === "SUBMITTED" && (
				<div className="flex flex-wrap items-end gap-2">
					<label
						htmlFor="book-price"
						className="flex flex-col gap-1 text-xs text-muted-foreground"
					>
						{t("price")}
						<Input
							id="book-price"
							type="number"
							min={0}
							step="any"
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
						{icon(<Check className="h-3.5 w-3.5" />)}
						{t("accept")}
					</Button>
				</div>
			)}
			{next && (
				<Button
					size="sm"
					className="w-fit gap-1.5"
					disabled={pending}
					onClick={() => onAdvance(next.to)}
				>
					{icon(<next.Icon className="h-3.5 w-3.5" />)}
					{next.label}
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
								{icon(<Undo2 className="h-3.5 w-3.5" />)}
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
