"use server";

import { type ActionResult, failFromZod, ok } from "@/lib/action-result";
import { prepareUpload } from "./attachment-files";
import { resolveViewer } from "./resolve-viewer";
import { startAttachmentSchema } from "./schemas";

/** A signed link to upload a file to, before sending it in a message. */
export async function startAttachmentUpload(
	input: unknown,
): Promise<ActionResult<{ key: string; uploadUrl: string }>> {
	const parsed = startAttachmentSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { as, ...file } = parsed.data;
	const viewer = await resolveViewer(as);
	return ok(await prepareUpload(viewer.id, file));
}
