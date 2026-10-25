import "server-only";

import { parsePriceList } from "@/lib/books/pricing";
import { db } from "@/lib/db";

/** A studio's book prices; the defaults (closed for orders) until it sets its own. */
export async function getPriceList(photographerId: string) {
	const row = await db.bookPriceList.findUnique({
		where: { photographerId },
		select: { data: true },
	});
	return parsePriceList(row?.data);
}
