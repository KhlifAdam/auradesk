import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { studioBrandSelect, toStudioBrand } from "@/services/clients/branding";
import { listGallerySummaries } from "@/services/galleries/summaries";
import { addMonths } from "@/services/privacy/purge";
import {
	canClientView,
	isDeliveredToClient,
} from "@/services/projects/visibility";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { pendingFor, type VerifiedContact } from "./contacts";
import type {
	PortalProject,
	PortalProjectDetail,
	PortalProjectPage,
} from "./types";

export const PORTAL_PAGE_SIZE = 12;

const portalInclude = {
	photographer: {
		select: { name: true, studio: { select: studioBrandSelect } },
	},
	_count: { select: { galleries: { where: { sharedAt: { not: null } } } } },
} satisfies Prisma.ProjectInclude;

type PortalRow = Prisma.ProjectGetPayload<{ include: typeof portalInclude }>;

function toPortalProject(row: PortalRow): PortalProject {
	const { studio, name } = row.photographer;
	return {
		id: row.id,
		title: row.title,
		photographerId: row.photographerId,
		stage: row.stage,
		eventDate: row.eventDate?.toISOString() ?? null,
		location: row.location ?? "",
		studio: studio ? toStudioBrand(studio) : null,
		photographerName: name,
		// Shared galleries open to the client from the Selection step.
		sharedGalleryCount: canClientView(row) ? row._count.galleries : 0,
	};
}

/** Every project of this client, across all photographers. */
export async function listPortalProjects(
	clientId: string,
	requestedPage: number,
): Promise<PortalProjectPage> {
	const where = { clientId };
	const total = await db.project.count({ where });
	const meta = pageMeta(requestedPage, total, PORTAL_PAGE_SIZE);
	const rows = await db.project.findMany({
		where,
		include: portalInclude,
		orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
		skip: pageSkip(meta.page, PORTAL_PAGE_SIZE),
		take: PORTAL_PAGE_SIZE,
	});
	return { ...meta, items: rows.map(toPortalProject) };
}

/** Delivered projects of a studio with a retention lose their galleries. */
async function galleriesDeleteAt(row: {
	photographerId: string;
	deliveredAt: Date | null;
}) {
	if (!row.deliveredAt) return null;
	const studio = await db.studio.findUnique({
		where: { photographerId: row.photographerId },
		select: { galleryRetentionMonths: true },
	});
	const months = studio?.galleryRetentionMonths;
	return months ? addMonths(row.deliveredAt, months).toISOString() : null;
}

export async function getPortalProject(
	clientId: string,
	id: string,
): Promise<PortalProjectDetail | null> {
	const row = await db.project.findFirst({
		where: { id, clientId },
		include: portalInclude,
	});
	if (!row) return null;

	return {
		...toPortalProject(row),
		description: row.description ?? "",
		serviceType: row.serviceType,
		mediaType: row.mediaType,
		startTime: row.startTime ?? "",
		endTime: row.endTime ?? "",
		locationType: row.locationType,
		deliveryDeadline: row.deliveryDeadline?.toISOString() ?? null,
		price: row.price?.toNumber() ?? null,
		advance: row.advance.toNumber(),
		paymentStatus: row.paymentStatus,
		delivered: isDeliveredToClient(row),
		galleriesDeleteAt: await galleriesDeleteAt(row),
		galleries: canClientView(row)
			? await listGallerySummaries(
					{ projectId: id, sharedAt: { not: null } },
					{ delivered: isDeliveredToClient(row) },
				)
			: [],
	};
}

const INVITATIONS_LIMIT = 20;

/** Invitations waiting for the contacts this client verified. */
export async function listPendingInvitations(
	contact: VerifiedContact,
): Promise<PortalProject[]> {
	const rows = await db.project.findMany({
		where: pendingFor(contact),
		include: portalInclude,
		orderBy: { invitedAt: "desc" },
		take: INVITATIONS_LIMIT,
	});
	return rows.map(toPortalProject);
}

/** Shown to unverified accounts, which must verify before seeing details. */
export function countPendingInvitations(email: string) {
	return db.project.count({
		where: { inviteEmail: email.toLowerCase(), inviteStatus: "PENDING" },
	});
}
