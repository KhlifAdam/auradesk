"use client";

import { Check, Loader2, MessageSquareText, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useErrorMessage } from "@/hooks/use-error-message";
import { respondToQuote } from "@/services/quotes/client-actions";
import type { QuoteStatus } from "@/services/quotes/options";

const NOTE_MAX = 1000;

interface QuoteResponseProps {
	quoteId: string;
	status: QuoteStatus;
	invoiced: boolean;
	respondedAt: string | null;
	clientNote: string;
	/** The request this quote prices, where the client completes the rest. */
	bookingId: string | null;
}

/**
 * The client's side panel on a quote: while it waits, a note for the studio
 * and the Accept / Decline buttons; once answered, what they chose and said.
 */
export function QuoteResponse({
	quoteId,
	status,
	invoiced,
	respondedAt,
	clientNote,
	bookingId,
}: QuoteResponseProps) {
	const t = useTranslations("Quotes.portal");
	const format = useFormatter();
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();
	const [note, setNote] = useState("");
	const open = status === "SENT" && !invoiced;

	const answer = (accept: boolean) =>
		startTransition(async () => {
			const result = await respondToQuote({ id: quoteId, accept, note });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			const { bookingId: request, needsDetails } = result.data;
			toast.success(
				needsDetails
					? t("acceptedComplete")
					: accept
						? t("accepted")
						: t("declined"),
			);
			// A booking's price accepted: on to the request, to finish it.
			if (accept && request) return router.push(`/portal/bookings/${request}`);
			router.refresh();
		});

	if (!open)
		return (
			<div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-sm">
				<p className="font-medium">
					{status === "ACCEPTED"
						? t("youAccepted")
						: status === "DECLINED"
							? t("youDeclined")
							: t("closed")}
				</p>
				{respondedAt && (
					<p className="text-xs text-muted-foreground">
						{format.dateTime(new Date(respondedAt), { dateStyle: "medium" })}
					</p>
				)}
				{bookingId && (
					<Button asChild size="sm" variant="outline" className="w-fit">
						<Link href={`/portal/bookings/${bookingId}`}>
							{t("openRequest")}
						</Link>
					</Button>
				)}
				{clientNote && (
					<p className="flex items-start gap-2 whitespace-pre-wrap rounded-lg bg-muted/50 p-2.5 text-xs">
						<MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
						{clientNote}
					</p>
				)}
			</div>
		);

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
			<p className="text-sm font-medium">{t("question")}</p>
			<label
				htmlFor="quote-note"
				className="flex flex-col gap-1 text-xs text-muted-foreground"
			>
				{t("noteLabel")}
				<Textarea
					id="quote-note"
					value={note}
					maxLength={NOTE_MAX}
					rows={4}
					placeholder={t("notePlaceholder")}
					onChange={(e) => setNote(e.target.value)}
					className="bg-card text-sm text-foreground"
				/>
			</label>
			<Button
				size="sm"
				className="gap-1.5"
				disabled={isPending}
				onClick={() => answer(true)}
			>
				{isPending ? (
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
				) : (
					<Check className="h-3.5 w-3.5" />
				)}
				{t("accept")}
			</Button>
			<Button
				size="sm"
				variant="outline"
				className="gap-1.5"
				disabled={isPending}
				onClick={() => answer(false)}
			>
				<X className="h-3.5 w-3.5" />
				{t("decline")}
			</Button>
			<p className="text-[11px] text-muted-foreground">{t("noteHint")}</p>
		</div>
	);
}
