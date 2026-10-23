import { MediaGridSkeleton } from "@/components/dashboard/media/media-grid-skeleton";
import { PageHeaderSkeleton } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";

export default function PortfolioFilesLoading() {
	return (
		<PageShell>
			<PageHeaderSkeleton />
			<div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
			<MediaGridSkeleton />
		</PageShell>
	);
}
