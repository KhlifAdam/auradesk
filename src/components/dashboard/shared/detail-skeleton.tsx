import { PageHeaderSkeleton } from "./page-header";
import { PageShell } from "./page-shell";

const block = "animate-pulse rounded-xl border border-border bg-card";

/**
 * Loading state for one item's page (a project, a booking) or its form:
 * header, the main details beside a side column, then sections. Never the
 * list's card grid, so opening an item doesn't look like the list again.
 */
export function DetailPageSkeleton() {
	return (
		<PageShell>
			<PageHeaderSkeleton />
			<div className={`h-14 ${block}`} />
			<div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
				<div className={`h-64 ${block}`} />
				<div className="flex flex-col gap-3">
					<div className={`h-28 ${block}`} />
					<div className={`h-32 ${block}`} />
				</div>
			</div>
			<div className={`h-12 ${block}`} />
			<div className={`h-24 ${block}`} />
		</PageShell>
	);
}
