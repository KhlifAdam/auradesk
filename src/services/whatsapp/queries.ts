import "server-only";

import {
	gatewayConfigured,
	getLinkStatus,
	type LinkStatus,
} from "@/lib/whatsapp/gateway-client";

export type WhatsappView =
	| { kind: "unconfigured" }
	| { kind: "unreachable" }
	| { kind: "live"; status: LinkStatus };

/** The link as the gateway sees it right now. */
export async function loadWhatsappView(): Promise<WhatsappView> {
	if (!gatewayConfigured()) return { kind: "unconfigured" };
	try {
		return { kind: "live", status: await getLinkStatus() };
	} catch {
		return { kind: "unreachable" };
	}
}
