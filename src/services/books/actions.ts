"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireClient } from "@/lib/auth/require-client";
import { bookDesignSchema } from "@/lib/books/design";
import { BOOK_FORMATS } from "@/lib/books/formats";
import { idSchema } from "@/services/shared/schemas";
import { getBookableProject } from "./access";
import { createBookFor, deleteDraft, saveDesign } from "./book-core";
import { listBookPhotos } from "./queries";
import type { BookPhotoPage } from "./types";

const createSchema = z.object({
	projectId: idSchema,
	format: z.enum(BOOK_FORMATS),
});

const projectPath = (projectId: string) => `/portal/projects/${projectId}`;

/** Starts a book from the project's delivered photos, laid out and ready to adjust. */
export async function createBook(
	input: unknown,
): Promise<ActionResult<{ id: string }>> {
	const { clientId } = await requireClient();
	const parsed = createSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { projectId, format } = parsed.data;

	const project = await getBookableProject(clientId, projectId);
	if (!project) return fail("notFound");
	const result = await createBookFor({ ...project, clientId }, format, false);
	if (result.ok) revalidatePath(projectPath(projectId));
	return result;
}

const saveSchema = z.object({ id: idSchema, design: bookDesignSchema });

/** Saves the client's own draft. Books the studio made for them aren't theirs to edit. */
export async function saveBook(input: unknown): Promise<ActionResult> {
	const { clientId } = await requireClient();
	const parsed = saveSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	return saveDesign(
		{ id: parsed.data.id, clientId, createdByStudio: false },
		parsed.data.design,
	);
}

export async function deleteBook(input: unknown): Promise<ActionResult> {
	const { clientId } = await requireClient();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const result = await deleteDraft({
		id: parsed.data,
		clientId,
		createdByStudio: false,
	});
	if (!result.ok) return result;
	revalidatePath(projectPath(result.data.projectId));
	return ok();
}

const photosSchema = z.object({
	projectId: idSchema,
	page: z.number().int().min(1).max(10_000),
});

/** One more page of the delivered photos, for the editor's photo tray. */
export async function loadBookPhotos(
	input: unknown,
): Promise<ActionResult<BookPhotoPage>> {
	const { clientId } = await requireClient();
	const parsed = photosSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const project = await getBookableProject(clientId, parsed.data.projectId);
	if (!project) return fail("notFound");
	return ok(await listBookPhotos(clientId, project.id, parsed.data.page));
}
