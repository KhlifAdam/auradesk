import { PageHeaderSkeleton } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";

export default function PrivacyLoading() {
	return (
		<PageShell>
			<PageHeaderSkeleton />
			<div className="flex max-w-2xl flex-col gap-3">
				<div className="h-56 animate-pulse rounded-xl border border-border bg-card" />
				<div className="h-28 animate-pulse rounded-xl border border-border bg-card" />
			</div>
		</PageShell>
	);
}
