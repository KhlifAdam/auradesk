"use client";

import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Builds the print-ready PDF on the server and saves it. */
export function DownloadPdfButton({ bookId }: { bookId: string }) {
	const t = useTranslations("BookOrders.pdf");
	const [busy, setBusy] = useState(false);

	async function download() {
		setBusy(true);
		try {
			const res = await fetch(`/api/books/${bookId}/pdf`);
			if (!res.ok) throw new Error(String(res.status));
			const missing = Number(res.headers.get("X-Book-Missing-Photos") ?? 0);
			const blob = await res.blob();
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = `photo-book-${bookId}.pdf`;
			link.click();
			URL.revokeObjectURL(link.href);
			if (missing > 0) toast.warning(t("missing", { count: missing }));
		} catch {
			toast.error(t("failed"));
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="flex flex-col gap-1">
			<Button
				size="sm"
				className="w-fit gap-1.5"
				disabled={busy}
				onClick={download}
			>
				{busy ? (
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
				) : (
					<Download className="h-3.5 w-3.5" />
				)}
				{t("button")}
			</Button>
			<p className="text-[11px] text-muted-foreground">
				{busy ? t("preparing") : t("hint")}
			</p>
		</div>
	);
}
