export default function PortalSettingsLoading() {
	return (
		<div className="flex max-w-2xl flex-col gap-3">
			<div className="h-14 w-48 animate-pulse rounded-lg bg-muted" />
			<div className="h-28 animate-pulse rounded-xl border border-border bg-card" />
			<div className="h-32 animate-pulse rounded-xl border border-border bg-card" />
			<div className="h-32 animate-pulse rounded-xl border border-border bg-card" />
		</div>
	);
}
