"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import type { AssistantUIMessage } from "@/lib/ai/assistant/tools";
import { toAssistantViewer } from "@/lib/ai/assistant/viewer";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { getPrivateViewUrl } from "@/lib/storage/r2-private";
import { proofUrl } from "@/services/galleries/sign-items";
import { idSchema } from "@/services/shared/schemas";
import { getThread, listRecentThreads } from "./queries";
import type { MediaPreview, ThreadSummary } from "./types";

const PREVIEW_COUNT = 12;

/** The signed-in user, when their role has an assistant. */
async function requireAssistantUser() {
	const session = await requireUser();
	return toAssistantViewer(session.user);
}

const renameSchema = z.object({
	id: idSchema,
	title: z.string().trim().min(1, "required").max(80, "tooLong"),
});

export async function renameThread(input: unknown): Promise<ActionResult> {
	const viewer = await requireAssistantUser();
	if (!viewer) return fail("forbidden");
	const parsed = renameSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { count } = await db.assistantThread.updateMany({
		where: { id: parsed.data.id, userId: viewer.userId },
		data: { title: parsed.data.title },
	});
	if (count === 0) return fail("notFound");
	revalidatePath("/dashboard/assistant", "layout");
	return ok();
}

export async function deleteThread(input: unknown): Promise<ActionResult> {
	const viewer = await requireAssistantUser();
	if (!viewer) return fail("forbidden");
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { count } = await db.assistantThread.deleteMany({
		where: { id: parsed.data, userId: viewer.userId },
	});
	if (count === 0) return fail("notFound");
	revalidatePath("/dashboard/assistant", "layout");
	return ok();
}

/** The latest threads, for the panel's history menu. */
export async function getRecentThreads(): Promise<ThreadSummary[]> {
	const viewer = await requireAssistantUser();
	return viewer ? listRecentThreads(viewer.userId) : [];
}

/** One thread's messages, to reopen it in the panel. */
export async function loadThread(
	input: unknown,
): Promise<ActionResult<{ title: string; messages: AssistantUIMessage[] }>> {
	const viewer = await requireAssistantUser();
	if (!viewer) return fail("forbidden");
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const thread = await getThread(viewer.userId, parsed.data);
	if (!thread) return fail("notFound");
	return ok({ title: thread.title, messages: thread.messages });
}

/** The client's portal conversation, to pick it up again after a reload. */
export async function loadPortalThread(
	input: unknown,
): Promise<ActionResult<{ title: string; messages: AssistantUIMessage[] }>> {
	const session = await requireUser();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const thread = await getThread(session.user.id, parsed.data, "portal");
	if (!thread) return fail("notFound");
	return ok({ title: thread.title, messages: thread.messages });
}

const previewSchema = z.object({
	projectId: idSchema,
	galleryId: idSchema.optional(),
});

/** A few photos of a project (or one of its galleries) for an expanded card. */
export async function getProjectMediaPreview(
	input: unknown,
): Promise<ActionResult<MediaPreview>> {
	const { photographerId } = await requirePhotographer();
	const parsed = previewSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { projectId, galleryId } = parsed.data;

	const where = {
		photographerId,
		gallery: { projectId, photographerId, ...(galleryId && { id: galleryId }) },
	};
	const [total, rows] = await Promise.all([
		db.galleryItem.count({ where }),
		db.galleryItem.findMany({
			where,
			orderBy: [{ position: "asc" }, { id: "asc" }],
			take: PREVIEW_COUNT,
			select: {
				id: true,
				key: true,
				previewKey: true,
				type: true,
				filename: true,
			},
		}),
	]);
	const items = await Promise.all(
		rows
			.filter((row) => row.previewKey || row.type === "IMAGE")
			.map(async (row) => ({
				id: row.id,
				// The light preview, or the app's proofing copy: never the original.
				url: row.previewKey
					? await getPrivateViewUrl(row.previewKey)
					: (proofUrl(row, false) as string),
				filename: row.filename,
				isVideo: row.type === "VIDEO",
			})),
	);
	return ok({ galleryId: galleryId ?? null, total, items });
}
