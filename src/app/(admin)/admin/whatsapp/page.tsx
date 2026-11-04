import { getTranslations } from "next-intl/server";
import { WhatsappPanel } from "@/components/admin/whatsapp/whatsapp-panel";
import { requireAdmin } from "@/lib/auth/require-admin";
import { whatsappEnabled } from "@/lib/whatsapp/connection-status";
import { loadWhatsappView } from "@/services/whatsapp/queries";

/** Link the WhatsApp number that sends sign-in codes and client notices. */
export default async function AdminWhatsappPage() {
	const t = await getTranslations("Admin.whatsapp");
	await requireAdmin();
	const initial = await loadWhatsappView();

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
			<WhatsappPanel initial={initial} />
			<p className="text-xs text-muted-foreground">{t("fallback")}</p>
		</>
	);
}
