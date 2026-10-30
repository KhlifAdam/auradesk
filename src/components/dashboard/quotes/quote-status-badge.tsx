import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuoteDisplayStatus } from "@/services/quotes/options";

const TONE: Record<QuoteDisplayStatus, string> = {
	DRAFT: "border-border bg-muted text-muted-foreground",
	SENT: "border-primary/40 bg-primary/10 text-primary",
	ACCEPTED: "border-success/40 bg-success/10 text-success",
	DECLINED: "border-destructive/40 bg-destructive/10 text-destructive",
	INVOICED: "border-event-meeting/40 bg-event-meeting/10 text-event-meeting",
};

export function QuoteStatusBadge({ status }: { status: QuoteDisplayStatus }) {
	const t = useTranslations("Quotes.status");

	return (
		<Badge
			variant="outline"
			className={cn("h-5 px-1.5 text-[10px] font-medium", TONE[status])}
		>
			{t(status)}
		</Badge>
	);
}
