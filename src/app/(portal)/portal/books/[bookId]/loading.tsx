/** The editor's shape while the book loads. */
export default function BookLoading() {
	return (
		<div className="flex flex-col gap-4">
			<div className="h-12 w-1/2 animate-pulse rounded-lg bg-muted" />
			<div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
				<div className="h-96 animate-pulse rounded-xl bg-muted" />
				<div className="h-96 animate-pulse rounded-xl bg-muted" />
			</div>
		</div>
	);
}
