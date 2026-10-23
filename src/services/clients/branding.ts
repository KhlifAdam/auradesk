import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { publicUrl } from "@/lib/storage/r2";

export interface StudioBrand {
	name: string;
	slug: string;
	logoUrl: string | null;
	/** The public site is live, so its portfolio can be linked to. */
	published: boolean;
}

export const studioBrandSelect = {
	name: true,
	slug: true,
	published: true,
	logo: { select: { key: true } },
} satisfies Prisma.StudioSelect;

type BrandRow = Prisma.StudioGetPayload<{ select: typeof studioBrandSelect }>;

export function toStudioBrand(studio: BrandRow): StudioBrand {
	return {
		name: studio.name,
		slug: studio.slug,
		logoUrl: studio.logo ? publicUrl(studio.logo.key) : null,
		published: studio.published,
	};
}
