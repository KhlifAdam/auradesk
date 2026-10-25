import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { CLIENT_DELIVERED_PROJECT } from "@/services/projects/visibility";

/**
 * Photos a client may put in a book: pictures from the shared final galleries
 * of a project that is delivered and paid, the same rule that opens the
 * originals for download. Always scoped to the signed-in client.
 */
export const bookablePhotos = (clientId: string, projectId: string) =>
	({
		type: "IMAGE",
		gallery: {
			kind: "FINAL",
			sharedAt: { not: null },
			projectId,
			project: { clientId, ...CLIENT_DELIVERED_PROJECT },
		},
	}) satisfies Prisma.GalleryItemWhereInput;

/** The client's delivered project, or null when it isn't theirs or isn't delivered yet. */
export function getBookableProject(clientId: string, projectId: string) {
	return db.project.findFirst({
		where: { id: projectId, clientId, ...CLIENT_DELIVERED_PROJECT },
		select: { id: true, title: true, photographerId: true },
	});
}
