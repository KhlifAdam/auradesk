import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BookEditor } from "@/components/books/book-editor";
import { BookOrderView } from "@/components/books/book-order-view";
import { requireClient } from "@/lib/auth/require-client";
import { BRAND_NAME } from "@/lib/brand";
import { getBook } from "@/services/books/queries";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("PhotoBook.editor");
	return { title: `${t("pageTitle")} | ${BRAND_NAME}` };
}

/**
 * A photo book: designed here while it is a draft, then followed here once
 * it has been sent to the studio (it can't be changed after that).
 */
export default async function BookPage({
	params,
}: {
	params: Promise<{ bookId: string }>;
}) {
	const { bookId } = await params;
	const { clientId } = await requireClient();
	const book = await getBook(clientId, bookId);
	if (!book) notFound();
	return book.order.status === "DRAFT" ? (
		<BookEditor book={book} />
	) : (
		<BookOrderView book={book} />
	);
}
