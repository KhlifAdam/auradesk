import { ListSkeleton } from "@/components/dashboard/shared/list-skeleton";
import { PageHeaderSkeleton } from "@/components/dashboard/shared/page-header";

export default function AdminLoading() {
	return (
		<>
			<PageHeaderSkeleton />
			<ListSkeleton rows={8} />
		</>
	);
}
