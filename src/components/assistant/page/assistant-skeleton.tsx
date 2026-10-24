/** The page's shape while threads and messages load. */
export function AssistantSkeleton() {
	return (
		<div className="flex min-h-0 flex-1">
			<div className="hidden w-64 shrink-0 flex-col gap-2 border-r border-border p-3 md:flex">
				{[0, 1, 2, 3, 4].map((i) => (
					<div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />
				))}
			</div>
			<div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end gap-3 p-4">
				<div className="ml-auto h-9 w-1/2 animate-pulse rounded-2xl bg-muted" />
				<div className="h-24 w-4/5 animate-pulse rounded-xl bg-muted" />
				<div className="h-12 animate-pulse rounded-2xl bg-muted" />
			</div>
		</div>
	);
}
