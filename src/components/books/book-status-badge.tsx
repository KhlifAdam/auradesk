"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { BookStatus } from "@/services/books/types";

const TONE: Record<BookStatus, string> = {
	DRAFT: "bg-muted text-muted-foreground",
	SUBMITTED: "bg-primary/15 text-primary",
	ACCEPTED: "bg-warning/15 text-warning",
	IN_PRODUCTION: "bg-primary/15 text-primary",
	READY: "bg-success/15 text-success",
	DELIVERED: "bg-success/15 text-success",
};

/**
 * Where a book stands, as a small coloured label. A design the studio changed
 * reads "Awaiting approval" until the client approves it.
 */
export function BookStatusBadge({
	status,
	awaitingApproval = false,
	className,
}: {
	status: BookStatus;
	awaitingApproval?: boolean;
	className?: string;
}) {
	const t = useTranslations("PhotoBook.status");
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
				awaitingApproval
					? "bg-event-meeting/15 text-event-meeting"
					: TONE[status],
				className,
			)}
		>
			{awaitingApproval ? t("awaitingApproval") : t(status)}
		</span>
	);
}
