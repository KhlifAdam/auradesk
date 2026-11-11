import { BookImage } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { listProjectBooksForStudio } from "@/services/books/order-queries";
import { NewBookDialog } from "./new-book-dialog";
import { OrderList } from "./order-list";

/** The project's photo books (orders and drafts), and a way to make one for the client. */
export async function ProjectBooksSection({
	photographerId,
	projectId,
	canCreate,
}: {
	photographerId: string;
	projectId: string;
	/** The project is delivered and has a client. */
	canCreate: boolean;
}) {
	const t = await getTranslations("BookOrders.section");
	const books = await listProjectBooksForStudio(photographerId, projectId);

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				{canCreate && <NewBookDialog fixedProjectId={projectId} small />}
			</div>
			{books.length === 0 ? (
				<p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
					<BookImage className="h-4 w-4 shrink-0" />
					{canCreate ? t("empty") : t("notDelivered")}
				</p>
			) : (
				<OrderList orders={books} hideProject />
			)}
		</section>
	);
}
