import { redirect } from "next/navigation";
import { BookEditor } from "@/components/books/book-editor";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { getEditableOrder } from "@/services/books/queries";

/** The studio redesigns an order before printing; once printing, back to the order. */
export default async function EditBookOrderPage({
	params,
}: {
	params: Promise<{ bookId: string }>;
}) {
	const { bookId } = await params;
	const { photographerId } = await requirePhotographer();
	const book = await getEditableOrder(photographerId, bookId);
	if (!book) redirect(`/dashboard/books/${bookId}`);
	return <BookEditor book={book} mode="order" />;
}
