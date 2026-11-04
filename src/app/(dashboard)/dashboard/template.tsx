import type { ReactNode } from "react";

/** Re-runs on every navigation: each page of the studio space fades in. */
export default function DashboardTemplate({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="space-fade flex min-h-0 flex-1 flex-col">{children}</div>
	);
}
