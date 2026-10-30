"use client";

import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { respondToQuote } from "@/services/quotes/client-actions";

/** The client's answer to a quote waiting for one. */
export function QuoteResponse({ quoteId }: { quoteId: string }) {
	const t = useTranslations("Quotes.portal");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();

	const answer = (accept: boolean) =>
		startTransition(async () => {
			const result = await respondToQuote({ id: quoteId, accept });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(accept ? t("accepted") : t("declined"));
			router.refresh();
		});

	return (
		<div className="flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 print:hidden">
			<p className="text-sm">{t("question")}</p>
			<div className="flex gap-2">
				<Button
					size="sm"
					variant="outline"
					className="h-8 gap-1.5 text-xs"
					disabled={isPending}
					onClick={() => answer(false)}
				>
					<X className="h-3.5 w-3.5" />
					{t("decline")}
				</Button>
				<Button
					size="sm"
					className="h-8 gap-1.5 text-xs"
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
			</div>
		</div>
	);
}
