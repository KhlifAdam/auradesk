"use client";

import {
	CheckCheck,
	Loader2,
	MessageSquareText,
	MessagesSquare,
	PencilLine,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useErrorMessage } from "@/hooks/use-error-message";
import {
	approveBookDesign,
	requestBookChange,
} from "@/services/books/change-actions";
import type { BookView } from "@/services/books/types";

const NOTE_MAX = 1000;

/**
 * What the client can do about a book already sent: before printing, ask
 * for a change and approve the studio's new design; after, talk to the studio.
 */
export function BookChangePanel({ book }: { book: BookView }) {
	const t = useTranslations("PhotoBook.change");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [pending, startTransition] = useTransition();
	const [open, setOpen] = useState(false);
	const [note, setNote] = useState("");
	const { order, studioName } = book;
	const beforePrinting =
		order.status === "SUBMITTED" || order.status === "ACCEPTED";

	const run = (
		task: () => Promise<{ ok: boolean; error?: string }>,
		done: string,
	) =>
		startTransition(async () => {
			const result = await task();
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(done);
			setOpen(false);
			setNote("");
			router.refresh();
		});

	if (!beforePrinting)
		return (
			<Button asChild variant="outline" size="sm" className="w-fit gap-1.5">
				<Link href="/portal/messages">
					<MessagesSquare className="h-4 w-4" />
					{t("contact", { studio: studioName })}
				</Link>
			</Button>
		);

	return (
		<div className="flex flex-col gap-3">
			{order.awaitingApproval ? (
				<p className="flex items-start gap-2 rounded-lg border border-event-meeting/40 bg-event-meeting/10 px-3 py-2 text-sm">
					<PencilLine className="mt-0.5 h-4 w-4 shrink-0 text-event-meeting" />
					{t("updated", { studio: studioName })}
				</p>
			) : (
				order.changeRequest && (
					<p className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
						<MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
						<span className="whitespace-pre-wrap">
							{t("requested", {
								note: order.changeRequest,
								studio: studioName,
							})}
						</span>
					</p>
				)
			)}
			<div className="flex flex-wrap gap-2">
				{order.awaitingApproval && (
					<Button
						size="sm"
						className="gap-1.5"
						disabled={pending}
						onClick={() =>
							run(() => approveBookDesign(book.id), t("approvedToast"))
						}
					>
						{pending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<CheckCheck className="h-4 w-4" />
						)}
						{t("approve")}
					</Button>
				)}
				<Button
					variant="outline"
					size="sm"
					className="gap-1.5"
					disabled={pending}
					onClick={() => setOpen(true)}
				>
					<MessageSquareText className="h-4 w-4" />
					{order.awaitingApproval || order.changeRequest
						? t("askAgain")
						: t("ask")}
				</Button>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("dialogTitle")}</DialogTitle>
						<DialogDescription>
							{t("dialogDescription", { studio: studioName })}
						</DialogDescription>
					</DialogHeader>
					<Textarea
						value={note}
						maxLength={NOTE_MAX}
						rows={4}
						placeholder={t("placeholder")}
						onChange={(e) => setNote(e.target.value)}
					/>
					<DialogFooter>
						<Button
							size="sm"
							className="gap-1.5"
							disabled={pending || note.trim() === ""}
							onClick={() =>
								run(
									() => requestBookChange({ id: book.id, note }),
									t("sentToast"),
								)
							}
						>
							{pending && <Loader2 className="h-4 w-4 animate-spin" />}
							{t("send")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
