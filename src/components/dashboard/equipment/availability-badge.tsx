import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Availability } from "@/services/equipment/options";

const TONE: Record<Availability, string> = {
	AVAILABLE: "border-success/40 bg-success/10 text-success",
	IN_USE: "border-primary/40 bg-primary/10 text-primary",
	RENTED_OUT: "border-event-meeting/40 bg-event-meeting/10 text-event-meeting",
	IN_MAINTENANCE: "border-event-other/40 bg-event-other/10 text-event-other",
	BROKEN: "border-destructive/40 bg-destructive/10 text-destructive",
	RETIRED: "border-border bg-muted text-muted-foreground",
};

/** Where the item is today: free, on a shoot, rented out, away… */
export function AvailabilityBadge({
	availability,
}: {
	availability: Availability;
}) {
	const t = useTranslations("Equipment.availability");

	return (
		<Badge
			variant="outline"
			className={cn("h-5 px-1.5 text-[10px] font-medium", TONE[availability])}
		>
			{t(availability)}
		</Badge>
	);
}
