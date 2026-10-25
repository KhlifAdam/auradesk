import { BookImage } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { requireClient } from "@/lib/auth/require-client";
import { MAX_BOOKS_PER_PROJECT } from "@/lib/books/formats";
import { listProjectBooks } from "@/services/books/queries";
import { BookStatusBadge } from "./book-status-badge";
import { CreateBookDialog } from "./create-book-dialog";
import { DeleteBookButton } from "./delete-book-button";

/** The client's photo books for a delivered project, and a way to start another. */
export async function ProjectBooks({ projectId }: { projectId: string }) {
	const t = await getTranslations("PhotoBook.section");
	const format = await getFormatter();
	const { clientId } = await requireClient();
	const books = await listProjectBooks(clientId, projectId);

	return (
		<section className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<h2 className="text-sm font-semibold">{t("title")}</h2>
					<p className="text-xs text-muted-foreground">{t("description")}</p>
				</div>
				<CreateBookDialog
					projectId={projectId}
					full={books.length >= MAX_BOOKS_PER_PROJECT}
				/>
			</div>
			{books.length === 0 ? (
				<p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
					<BookImage className="h-4 w-4 shrink-0" />
					{t("empty")}
				</p>
			) : (
				<ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
					{books.map((book) => (
						<li
							key={book.id}
							className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-200 hover:shadow-luminous"
						>
							<Link href={`/portal/books/${book.id}`} className="flex flex-col">
								<span className="relative aspect-[4/3] bg-muted">
									{book.coverUrl && (
										<Image
											src={book.coverUrl}
											alt=""
											fill
											unoptimized
											sizes="260px"
											className="object-cover"
										/>
									)}
								</span>
								<span className="flex flex-col gap-0.5 p-2.5">
									<span className="flex items-center justify-between gap-2">
										<span className="truncate text-sm font-medium">
											{book.title}
										</span>
										<BookStatusBadge status={book.status} />
									</span>
									<span className="text-[11px] text-muted-foreground">
										{t("meta", {
											count: book.pageCount,
											when: format.relativeTime(
												new Date(book.updatedAt),
												new Date(),
											),
										})}
									</span>
								</span>
							</Link>
							<div className="flex justify-end border-t border-border px-1.5 py-1">
								{book.status === "DRAFT" && (
									<DeleteBookButton bookId={book.id} title={book.title} />
								)}
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
