import "server-only";

import { db } from "@/lib/db";
import { realEmail } from "@/lib/phone";
import { clientNextStep } from "@/lib/projects/client-next-step";
import { listProjectBooks } from "@/services/books/queries";
import {
	listClientInvoices,
	listClientProjectInvoices,
} from "@/services/invoices/queries";
import { roundMoney } from "@/services/invoices/totals";
import { getPortalProject } from "@/services/portal/queries";
import { getProjectEstimate } from "@/services/projects/estimate";

const studioName = (p: { name: string; studio: { name: string } | null }) =>
	p.studio?.name ?? p.name;

/** The client's projects across all their studios, most recently active first. */
export async function listClientProjectsForAssistant(clientId: string) {
	const rows = await db.project.findMany({
		where: { clientId },
		orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
		take: 20,
		select: {
			id: true,
			title: true,
			stage: true,
			eventDate: true,
			paymentStatus: true,
			photographer: {
				select: { name: true, studio: { select: { name: true } } },
			},
		},
	});
	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		stage: row.stage,
		eventDate: row.eventDate?.toISOString() ?? null,
		paid: row.paymentStatus === "PAID",
		studio: studioName(row.photographer),
	}));
}

/** Everything about one of the client's projects, with the next thing to do. */
export async function getClientProjectStatus(
	clientId: string,
	projectId: string,
) {
	const project = await getPortalProject(clientId, projectId);
	if (!project) return null;
	const [invoices, books, estimate] = await Promise.all([
		listClientProjectInvoices(clientId, projectId),
		listProjectBooks(clientId, projectId),
		project.stage === "DELIVERY"
			? null
			: getProjectEstimate(project.photographerId, projectId),
	]);
	const owed = roundMoney(
		invoices
			.filter((i) => i.status === "SENT")
			.reduce((sum, i) => sum + Math.max(0, i.total - i.paid), 0),
	);
	const { step: nextStep } = clientNextStep(project, invoices);

	return {
		id: project.id,
		title: project.title,
		studio: project.studio?.name ?? project.photographerName,
		stage: project.stage,
		mediaType: project.mediaType,
		eventDate: project.eventDate,
		deliveryDeadline: project.deliveryDeadline,
		delivered: project.delivered,
		price: project.price,
		paidSoFar: project.advance,
		paymentStatus: project.paymentStatus,
		owedOnInvoices: owed,
		galleries: project.galleries.map((g) => ({
			id: g.id,
			title: g.title,
			kind: g.kind,
			files: g.itemCount,
			selected: g.selectedCount,
			submitted: g.submitted,
		})),
		invoices: invoices.map((i) => ({
			id: i.id,
			number: i.number,
			status: i.status,
			total: i.total,
			paid: i.paid,
		})),
		books: books.map((b) => ({ id: b.id, title: b.title, status: b.status })),
		expectedReady: estimate?.estimate.finishDate ?? null,
		nextStep,
	};
}

/** The client's issued invoices across studios, unpaid first. */
export async function listClientInvoicesForAssistant(clientId: string) {
	const invoices = await listClientInvoices(clientId);
	const about = await db.invoice.findMany({
		where: { id: { in: invoices.map((i) => i.id) }, clientId },
		select: {
			id: true,
			photographer: {
				select: { name: true, studio: { select: { name: true } } },
			},
			project: { select: { title: true } },
			photoBook: { select: { id: true } },
		},
	});
	const byId = new Map(about.map((row) => [row.id, row]));
	return invoices
		.map((invoice) => {
			const row = byId.get(invoice.id);
			return {
				id: invoice.id,
				number: invoice.number,
				status: invoice.displayStatus,
				dueDate: invoice.dueDate,
				total: invoice.total,
				balance: invoice.balance,
				studio: row ? studioName(row.photographer) : "",
				about: row?.project?.title ?? null,
				photoBook: Boolean(row?.photoBook),
			};
		})
		.sort((a, b) => Number(b.balance > 0) - Number(a.balance > 0));
}

/** The client's photo books, across projects. */
export async function listClientBooksForAssistant(clientId: string) {
	const rows = await db.photoBook.findMany({
		where: { clientId, NOT: { createdByStudio: true, status: "DRAFT" } },
		orderBy: { updatedAt: "desc" },
		take: 20,
		select: {
			id: true,
			title: true,
			status: true,
			total: true,
			project: { select: { id: true, title: true } },
		},
	});
	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		status: row.status,
		total: row.total?.toNumber() ?? null,
		projectId: row.project.id,
		projectTitle: row.project.title,
	}));
}

/** How to reach the studios the client works with. */
export async function listClientStudioContacts(clientId: string) {
	const projects = await db.project.findMany({
		where: { clientId },
		distinct: ["photographerId"],
		select: {
			photographer: {
				select: {
					name: true,
					email: true,
					studio: {
						select: {
							name: true,
							email: true,
							phone: true,
							city: true,
							slug: true,
							published: true,
						},
					},
				},
			},
		},
	});
	return projects.map(({ photographer: p }) => ({
		name: p.studio?.name ?? p.name,
		email: p.studio?.email ?? realEmail(p.email) ?? "",
		phone: p.studio?.phone ?? "",
		city: p.studio?.city ?? "",
		site: p.studio?.published ? `/s/${p.studio.slug}` : null,
	}));
}
