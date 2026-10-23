import { PageHeaderSkeleton } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";

export default function SiteSectionsLoading() {
	return (
		<PageShell>
			<PageHeaderSkeleton />
			<div className="flex max-w-3xl flex-col gap-2">
				{Array.from({ length: 9 }, (_, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders.
						key={index}
						className="h-14 animate-pulse rounded-xl border border-border bg-card"
					/>
				))}
			</div>
		</PageShell>
	);
}
