"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth/require-admin";
import { toE164 } from "@/lib/phone";
import {
	cloudConfigured,
	sendCloudHelloWorld,
} from "@/lib/whatsapp/cloud/cloud-client";
import { readConnection, recordStatus } from "@/lib/whatsapp/connection-status";
import {
	gatewayConfigured,
	getLinkStatus,
	type LinkStatus,
	requestLink,
	sendWhatsappText,
	unlink,
} from "@/lib/whatsapp/gateway-client";
import { logPlatformAction } from "@/services/admin/audit";
import { loadWhatsappView, type WhatsappView } from "./queries";
import { whatsappTestSchema } from "./schemas";

/** The link as the gateway sees it right now; polled by the admin page. */
export async function fetchWhatsappStatus(): Promise<WhatsappView> {
	await requireAdmin();
	const view = await loadWhatsappView();
	if (view.kind === "live") await syncConnected(view.status);
	return view;
}

/**
 * Clears the banner as soon as the page sees the link back, without
 * waiting for the gateway's webhook.
 */
async function syncConnected(status: LinkStatus) {
	if (status.state !== "CONNECTED") return;
	const saved = await readConnection();
	if (saved?.status === "CONNECTED") return;
	await recordStatus("CONNECTED", { phone: status.phone });
	revalidatePath("/admin", "layout");
}

/** Reconnects, or shows a fresh QR code to link a number. */
export async function requestWhatsappLink(): Promise<ActionResult<LinkStatus>> {
	const { session } = await requireAdmin();
	if (!gatewayConfigured()) return fail("whatsappUnreachable");
	try {
		const status = await requestLink();
		await logPlatformAction(
			session.user,
			"WHATSAPP_LINK_REQUESTED",
			"WhatsApp",
		);
		return ok(status);
	} catch {
		return fail("whatsappUnreachable");
	}
}

/** Unlinks the number: codes fall back to SMS until a new one is linked. */
export async function unlinkWhatsapp(): Promise<ActionResult<LinkStatus>> {
	const { session } = await requireAdmin();
	if (!gatewayConfigured()) return fail("whatsappUnreachable");
	try {
		const before = await getLinkStatus();
		const status = await unlink();
		await logPlatformAction(
			session.user,
			"WHATSAPP_UNLINKED",
			before.phone ?? "WhatsApp",
		);
		await recordStatus("LOGGED_OUT", { silent: true });
		revalidatePath("/admin", "layout");
		return ok(status);
	} catch {
		return fail("whatsappUnreachable");
	}
}

/**
 * Sends a short message over one WhatsApp channel only (no fallback), to
 * check it delivers. The official API can only send a template: Meta's sample.
 */
export async function sendWhatsappTest(input: unknown): Promise<ActionResult> {
	await requireAdmin();
	const parsed = whatsappTestSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const to = toE164(parsed.data.phone) as string;
	if (parsed.data.channel === "CLOUD") return sendCloudTest(to);
	if (!gatewayConfigured()) return fail("whatsappUnreachable");

	const t = await getTranslations("Admin.whatsapp.test");
	try {
		const outcome = await sendWhatsappText(to, t("message"));
		if (outcome === "not-connected") return fail("whatsappNotConnected");
		if (outcome === "not-on-whatsapp") return fail("whatsappNotOnWhatsapp");
		return ok();
	} catch {
		return fail("whatsappUnreachable");
	}
}

async function sendCloudTest(to: string): Promise<ActionResult> {
	if (!cloudConfigured()) return fail("whatsappCloudRejected");
	try {
		const outcome = await sendCloudHelloWorld(to);
		if (outcome === "not-on-whatsapp") return fail("whatsappNotOnWhatsapp");
		if (outcome !== "sent") return fail("whatsappCloudRejected");
		return ok();
	} catch {
		return fail("whatsappCloudRejected");
	}
}
