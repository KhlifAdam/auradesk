import { PageHeaderSkeleton } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";

export default function QuoteLoading() {
	return (
		<PageShell>
			<PageHeaderSkeleton />
			<div className="h-[32rem] max-w-3xl animate-pulse rounded-xl border border-border bg-card" />
		</PageShell>
	);
}
