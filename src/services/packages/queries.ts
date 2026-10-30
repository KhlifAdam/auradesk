import "server-only";

import { db } from "@/lib/db";
import { toMediaItem } from "@/services/media/queries";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { CURRENCIES, PACKAGE_PAGE_SIZE } from "./schemas";
import type { PackagePage } from "./types";

type Currency = (typeof CURRENCIES)[number];

export async function listPackages(
	photographerId: string,
	requestedPage: number,
): Promise<PackagePage> {
	const total = await db.package.count({ where: { photographerId } });
	const meta = pageMeta(requestedPage, total, PACKAGE_PAGE_SIZE);

	const packages = await db.package.findMany({
		where: { photographerId },
		orderBy: [{ position: "asc" }, { id: "asc" }],
		skip: pageSkip(meta.page, PACKAGE_PAGE_SIZE),
		take: PACKAGE_PAGE_SIZE,
		include: { cover: true },
	});

	return {
		...meta,
		items: packages.map((pkg) => ({
			id: pkg.id,
			name: pkg.name,
			description: pkg.description ?? "",
			price: pkg.price.toNumber(),
			currency: (CURRENCIES as readonly string[]).includes(pkg.currency)
				? (pkg.currency as Currency)
				: "TND",
			durationMinutes: pkg.durationMinutes,
			unlimitedDuration: pkg.unlimitedDuration,
			photoCount: pkg.photoCount,
			unlimitedPhotos: pkg.unlimitedPhotos,
			deliverables: pkg.deliverables,
			coverMediaId: pkg.coverMediaId,
			active: pkg.active,
			featured: pkg.featured,
			cover: pkg.cover ? toMediaItem(pkg.cover) : null,
		})),
	};
}
