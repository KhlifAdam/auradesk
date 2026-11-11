import "server-only";

import { db } from "@/lib/db";
import { coverImageUrl, coverItemOf } from "@/services/galleries/cover";

export interface ProjectCover {
	url: string;
	/** The gallery cover's focal point, 0–1, kept in frame when cropped. */
	focalX: number;
	focalY: number;
}

/**
 * A cover for each project: its delivered (final) album's cover, framed the
 * same way, else the first proofs album with a photo. It is read from the
 * gallery each time, so changing the album cover changes it here too.
 * Projects without photos are left out.
 */
export async function getProjectCovers(
	photographerId: string,
	projectIds: string[],
): Promise<Record<string, ProjectCover>> {
	if (projectIds.length === 0) return {};
	const galleries = await db.gallery.findMany({
		where: { photographerId, projectId: { in: projectIds } },
		// FINAL sorts after PROOFS, so descending puts finals first.
		orderBy: [{ kind: "desc" }, { createdAt: "asc" }, { id: "asc" }],
		select: {
			id: true,
			projectId: true,
			coverItemId: true,
			coverFocalX: true,
			coverFocalY: true,
		},
	});

	const covers = await Promise.all(
		projectIds.map(async (projectId) => {
			for (const gallery of galleries) {
				if (gallery.projectId !== projectId) continue;
				const item = await coverItemOf(gallery);
				if (!item) continue;
				const cover: ProjectCover = {
					// The studio owns the originals, so the link is signed.
					url: await coverImageUrl(item, true),
					focalX: gallery.coverFocalX,
					focalY: gallery.coverFocalY,
				};
				return [projectId, cover] as const;
			}
			return null;
		}),
	);
	return Object.fromEntries(covers.filter((cover) => cover !== null));
}
