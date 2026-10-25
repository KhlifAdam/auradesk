import { BookImage, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import { listProjectBooksForStudio } from "@/services/books/order-queries";
import { NewBookDialog } from "./new-book-dialog";

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
				<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
					{books.map((book) => (
						<li key={book.id}>
							<Link
								href={`/dashboard/books/${book.id}`}
								className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
							>
								<span className="truncate text-sm font-medium">
									{book.title}
								</span>
								<span className="flex items-center gap-2">
									<BookStatusBadge status={book.status} />
									<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
