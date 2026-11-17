"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { type ActionResult, failFromZod, ok } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { logPlatformAction } from "@/services/admin/audit";
import { whatsappRouteSchema } from "./schemas";

/** Chooses which WhatsApp (linked number or official API) sends one kind of message. */
export async function setWhatsappRoute(input: unknown): Promise<ActionResult> {
	const { session } = await requireAdmin();
	const parsed = whatsappRouteSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { kind, channel } = parsed.data;
	await db.whatsappRoute.upsert({
		where: { kind },
		create: { kind, channel },
		update: { channel },
	});
	const t = await getTranslations("Admin.whatsapp.routes");
	await logPlatformAction(
		session.user,
		"WHATSAPP_ROUTE_CHANGED",
		`${t(`kinds.${kind}`)} → ${t(channel)}`,
	);
	revalidatePath("/admin/whatsapp");
	return ok();
}
