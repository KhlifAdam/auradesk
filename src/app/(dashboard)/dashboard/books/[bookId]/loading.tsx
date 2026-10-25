import { Skeleton } from "@/components/ui/skeleton";

export default function BookOrderLoading() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-8 w-64" />
			<Skeleton className="h-40 w-full" />
			<Skeleton className="h-64 w-full" />
		</div>
	);
}
