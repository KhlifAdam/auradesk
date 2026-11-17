import { getTranslations } from "next-intl/server";
import { CloudStatusCard } from "@/components/admin/whatsapp/cloud-status-card";
import { RouteTable } from "@/components/admin/whatsapp/route-table";
import { WhatsappPanel } from "@/components/admin/whatsapp/whatsapp-panel";
import { requireAdmin } from "@/lib/auth/require-admin";
import { whatsappEnabled } from "@/lib/whatsapp/connection-status";
import { allRoutes } from "@/lib/whatsapp/routing";
import { loadCloudView, loadWhatsappView } from "@/services/whatsapp/queries";

/**
 * The two WhatsApp senders (the linked number and the official API) and
 * which one sends each kind of message.
 */
export default async function AdminWhatsappPage() {
	const t = await getTranslations("Admin.whatsapp");
	await requireAdmin();
	const [initial, cloud, routes] = await Promise.all([
		loadWhatsappView(),
		loadCloudView(),
		allRoutes(),
	]);
	const ready = {
		BAILEYS: initial.kind === "live" && initial.status.state === "CONNECTED",
		CLOUD: cloud.kind === "live",
	};

	return (
		<>
			<div className="flex flex-col gap-0.5">
				<h1 className="font-display text-xl font-bold tracking-tight">
					{t("title")}
				</h1>
				<p className="text-xs text-muted-foreground">{t("description")}</p>
			</div>
			{!whatsappEnabled() && (
				<p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
					{t("disabled")}
				</p>
			)}
			<RouteTable routes={routes} ready={ready} />
			<CloudStatusCard view={cloud} />
			<WhatsappPanel initial={initial} />
			<p className="text-xs text-muted-foreground">{t("fallback")}</p>
		</>
	);
}
