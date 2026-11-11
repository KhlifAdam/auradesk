import { CARD_GRID } from "@/components/dashboard/shared/card-grid";
import { PageHeaderSkeleton } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";

const PLACEHOLDER_KEYS = ["a", "b", "c", "d", "e"];

export default function ServicesLoading() {
	return (
		<PageShell>
			<PageHeaderSkeleton />
			<div className={CARD_GRID}>
				{PLACEHOLDER_KEYS.map((key) => (
					<div key={key} className="h-52 animate-pulse rounded-lg bg-muted" />
				))}
			</div>
		</PageShell>
	);
}
