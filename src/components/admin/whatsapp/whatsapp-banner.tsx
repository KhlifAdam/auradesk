import { ArrowRight, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
	readConnection,
	whatsappEnabled,
} from "@/lib/whatsapp/connection-status";

/** Over every admin page while codes can't go out over WhatsApp. */
export async function WhatsappBanner() {
	if (!whatsappEnabled()) return null;
	const connection = await readConnection();
	if (connection?.status === "CONNECTED") return null;
	const t = await getTranslations("Admin.whatsappBanner");

	return (
		<div
			role="alert"
			className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-destructive/30 bg-destructive/10 px-4 py-1.5 text-xs"
		>
			<span className="flex items-center gap-1.5">
				<TriangleAlert className="h-3.5 w-3.5 text-destructive" />
				{t(connection?.status ?? "LOGGED_OUT")}
			</span>
			<Link
				href="/admin/whatsapp"
				className="flex items-center gap-1 font-medium text-destructive hover:underline"
			>
				{t("action")}
				<ArrowRight className="h-3 w-3" />
			</Link>
		</div>
	);
}
