import { PageHeaderSkeleton } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";

export default function AccountLoading() {
	return (
		<PageShell>
			<PageHeaderSkeleton />
			<div className="flex max-w-2xl flex-col gap-3">
				<div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
				<div className="h-32 animate-pulse rounded-xl border border-border bg-card" />
				<div className="h-32 animate-pulse rounded-xl border border-border bg-card" />
			</div>
		</PageShell>
	);
}
