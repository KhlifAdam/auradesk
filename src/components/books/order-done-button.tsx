"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { shareDesignUpdate } from "@/services/books/change-actions";

/** Leaves the order's editor once the last change is saved, and tells the client. */
export function OrderDoneButton({
	bookId,
	flush,
	disabled,
	changed,
}: {
	bookId: string;
	flush: () => Promise<unknown>;
	disabled: boolean;
	/** The design changed in this visit; only then is the client told. */
	changed: boolean;
}) {
	const t = useTranslations("PhotoBook.editor");
	const router = useRouter();

	return (
		<Button
			size="sm"
			className="h-8 gap-1.5 text-xs"
			disabled={disabled}
			onClick={async () => {
				await flush();
				// Tells the client there is a new design to approve.
				if (changed) await shareDesignUpdate(bookId);
				router.push(`/dashboard/books/${bookId}`);
				router.refresh();
			}}
		>
			<Check className="h-3.5 w-3.5" />
			{t("orderDone")}
		</Button>
	);
}
