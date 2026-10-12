import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InvoiceDisplayStatus } from "@/services/invoices/options";

const TONE: Record<InvoiceDisplayStatus, string> = {
	DRAFT: "border-border bg-muted text-muted-foreground",
	SENT: "border-primary/40 bg-primary/10 text-primary",
	PAID: "border-success/40 bg-success/10 text-success",
	OVERDUE: "border-destructive/40 bg-destructive/10 text-destructive",
	CANCELLED: "border-border bg-muted/50 text-muted-foreground line-through",
};

export function InvoiceStatusBadge({
	status,
}: {
	status: InvoiceDisplayStatus;
}) {
	const t = useTranslations("Invoices.status");

	return (
		<Badge
			variant="outline"
			className={cn("h-5 px-1.5 text-[10px] font-medium", TONE[status])}
		>
			{t(status)}
		</Badge>
	);
}
