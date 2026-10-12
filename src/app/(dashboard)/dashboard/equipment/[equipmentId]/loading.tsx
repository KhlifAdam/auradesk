import { PageHeaderSkeleton } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";

export default function EquipmentItemLoading() {
	return (
		<PageShell>
			<PageHeaderSkeleton />
			<div className="h-48 animate-pulse rounded-xl border border-border bg-card" />
		</PageShell>
	);
}
