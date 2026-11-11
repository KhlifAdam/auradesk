"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireClient } from "@/lib/auth/require-client";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { flagProjectForClient } from "@/services/changes/flag";
import { sendMessage } from "@/services/messages/actions";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { idSchema } from "@/services/shared/schemas";

/**
 * After sending a book, the client and the studio agree on changes here:
 * the client asks, the studio edits (see order-edit-actions), the client
 * approves. Each step also lands in their conversation, so they can talk.
 * Only before printing: once printing starts the book can't change.
 */
const OPEN = ["SUBMITTED", "ACCEPTED"] as const;

function revalidateBook(bookId: string, projectId: string) {
	revalidatePath(`/portal/books/${bookId}`);
	revalidatePath(`/portal/projects/${projectId}`);
	revalidatePath("/dashboard/books", "layout");
	revalidateClientWork();
}

/** Posts in the pair's conversation; a failure there never undoes the book step. */
async function post(
	as: "client" | "photographer",
	partnerId: string,
	body: string,
) {
	const result = await sendMessage({
		as,
		conversationId: null,
		partnerId,
		body,
	}).catch(() => null);
	if (!result?.ok) console.error("Failed to post the photo book message.");
}

const requestSchema = z.object({
	id: idSchema,
	note: z.string().trim().min(1, "required").max(1000, "tooLong"),
});

/** The client asks the studio to change a book they already sent. */
export async function requestBookChange(input: unknown): Promise<ActionResult> {
	const { clientId } = await requireClient();
	const parsed = requestSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { id, note } = parsed.data;

	const book = await db.photoBook.findFirst({
		where: { id, clientId },
		select: { title: true, projectId: true, photographerId: true },
	});
	if (!book) return fail("notFound");
	const { count } = await db.photoBook.updateMany({
		where: { id, clientId, status: { in: [...OPEN] } },
		data: { changeRequest: note, changeRequestedAt: new Date() },
	});
	if (count === 0) return fail("bookLocked");

	const t = await getTranslations("PhotoBook.messages");
	await post(
		"client",
		book.photographerId,
		t("changeRequest", { title: book.title, note }),
	);
	revalidateBook(id, book.projectId);
	return ok();
}

/** The client accepts the studio's new design; printing may start. */
export async function approveBookDesign(input: unknown): Promise<ActionResult> {
	const { clientId } = await requireClient();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const book = await db.photoBook.findFirst({
		where: { id: parsed.data, clientId },
		select: { title: true, projectId: true, photographerId: true },
	});
	if (!book) return fail("notFound");
	const { count } = await db.photoBook.updateMany({
		where: {
			id: parsed.data,
			clientId,
			status: { in: [...OPEN] },
			awaitingApprovalAt: { not: null },
		},
		data: {
			awaitingApprovalAt: null,
			changeRequest: "",
			changeRequestedAt: null,
		},
	});
	if (count === 0) return fail("bookWrongStatus");

	const t = await getTranslations("PhotoBook.messages");
	await post(
		"client",
		book.photographerId,
		t("approved", { title: book.title }),
	);
	revalidateBook(parsed.data, book.projectId);
	return ok();
}

/** The studio is done editing: the client is told to review and approve. */
export async function shareDesignUpdate(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const book = await db.photoBook.findFirst({
		where: {
			id: parsed.data,
			photographerId,
			status: { in: [...OPEN] },
		},
		select: {
			title: true,
			projectId: true,
			clientId: true,
			awaitingApprovalAt: true,
		},
	});
	if (!book) return fail("notFound");
	// Nothing changed in the editor: nothing to approve.
	if (!book.awaitingApprovalAt) return ok();

	const t = await getTranslations("PhotoBook.messages");
	await post(
		"photographer",
		book.clientId,
		t("updated", { title: book.title }),
	);
	// The message above told them; the project still shows why.
	await flagProjectForClient(book.projectId, {}, "book");
	revalidateBook(parsed.data, book.projectId);
	return ok();
}
