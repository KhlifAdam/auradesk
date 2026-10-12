import "server-only";

import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { realEmail } from "@/lib/phone";
import type { InvoiceValues } from "./schemas";

/** A new invoice for a project: its client and one line at the project price. */
export async function invoicePrefillFromProject(
	photographerId: string,
	projectId: string,
): Promise<{ values: Partial<InvoiceValues>; projectTitle: string } | null> {
	const project = await db.project.findFirst({
		where: { id: projectId, photographerId },
		select: {
			id: true,
			title: true,
			serviceType: true,
			price: true,
			clientPhone: true,
			inviteEmail: true,
			client: { select: { id: true, name: true, email: true } },
			booking: {
				select: { clientName: true, clientEmail: true, clientPhone: true },
			},
		},
	});
	if (!project) return null;

	const tService = await getTranslations("Projects.serviceTypes");
	const { client, booking } = project;
	const values: Partial<InvoiceValues> = {
		projectId: project.id,
		clientId: client?.id ?? "",
		clientName: client?.name ?? booking?.clientName ?? "",
		clientEmail:
			(client && realEmail(client.email)) ||
			booking?.clientEmail ||
			project.inviteEmail ||
			"",
		clientPhone: project.clientPhone ?? booking?.clientPhone ?? "",
		items: [
			{
				description: `${tService(project.serviceType)} · ${project.title}`,
				quantity: 1,
				unitPrice: project.price?.toNumber() ?? null,
			},
		],
	};
	return { values, projectTitle: project.title };
}
