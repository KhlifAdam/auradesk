import "server-only";

import {
	type CloudSender,
	cloudConfigured,
	getCloudSender,
} from "@/lib/whatsapp/cloud/cloud-client";
import {
	gatewayConfigured,
	getLinkStatus,
	type LinkStatus,
} from "@/lib/whatsapp/gateway-client";

export type WhatsappView =
	| { kind: "unconfigured" }
	| { kind: "unreachable" }
	| { kind: "live"; status: LinkStatus };

export type CloudView =
	| { kind: "unconfigured" }
	| { kind: "unreachable" }
	| { kind: "live"; sender: CloudSender };

/** The link as the gateway sees it right now. */
export async function loadWhatsappView(): Promise<WhatsappView> {
	if (!gatewayConfigured()) return { kind: "unconfigured" };
	try {
		return { kind: "live", status: await getLinkStatus() };
	} catch {
		return { kind: "unreachable" };
	}
}

/** The official API's sending number, as Meta reports it. */
export async function loadCloudView(): Promise<CloudView> {
	if (!cloudConfigured()) return { kind: "unconfigured" };
	try {
		return { kind: "live", sender: await getCloudSender() };
	} catch {
		return { kind: "unreachable" };
	}
}
