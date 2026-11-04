import { ListSkeleton } from "@/components/dashboard/shared/list-skeleton";

export default function AdminSectionLoading() {
	return (
		<>
			<div className="h-10 w-56 animate-pulse rounded-lg bg-muted" />
			<ListSkeleton />
		</>
	);
}
