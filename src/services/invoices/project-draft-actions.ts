"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { searchQuerySchema } from "@/services/clients/schemas";
import type { PickerOption } from "@/services/shared/picker";
import { idSchema } from "@/services/shared/schemas";
import { type ProjectInvoiceDraft, projectInvoiceDraft } from "./prefill";

const PICKER_LIMIT = 8;
const OPEN_LIMIT = 5;

/** The studio's projects to bill, matched by project or client name. */
export async function findInvoiceProjects(
	input: unknown,
): Promise<ActionResult<PickerOption[]>> {
	const { photographerId } = await requirePhotographer();
	const parsed = searchQuerySchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const q = parsed.data;
	const rows = await db.project.findMany({
		where: {
			photographerId,
			...(q && {
				OR: [
					{ title: { contains: q, mode: "insensitive" } },
					{ client: { name: { contains: q, mode: "insensitive" } } },
				],
			}),
		},
		select: { id: true, title: true, client: { select: { name: true } } },
		orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
		take: PICKER_LIMIT,
	});
	return ok(
		rows.map((row) => ({
			id: row.id,
			label: row.title,
			detail: row.client?.name ?? "",
		})),
	);
}

/** What an invoice for this project should bill (see `projectInvoiceDraft`). */
export async function loadProjectInvoiceDraft(
	input: unknown,
): Promise<ActionResult<ProjectInvoiceDraft>> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const draft = await projectInvoiceDraft(photographerId, parsed.data);
	return draft ? ok(draft) : fail("notFound");
}

/** A client's projects that still have something to bill, for the form's hint. */
export async function findClientOpenProjects(
	input: unknown,
): Promise<ActionResult<{ id: string; title: string }[]>> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const rows = await db.project.findMany({
		where: {
			photographerId,
			clientId: parsed.data,
			paymentStatus: { not: "PAID" },
		},
		select: { id: true, title: true },
		orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
		take: OPEN_LIMIT * 2,
	});
	const drafts = await Promise.all(
		rows.map((row) => projectInvoiceDraft(photographerId, row.id)),
	);
	return ok(
		drafts
			.filter((draft) => draft && draft.kind !== "invoiced")
			.slice(0, OPEN_LIMIT)
			.map((draft) => ({
				id: draft?.projectId ?? "",
				title: draft?.projectTitle ?? "",
			})),
	);
}
