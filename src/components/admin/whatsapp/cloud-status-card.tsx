import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CloudView } from "@/services/whatsapp/queries";
import { WhatsappTestForm } from "./whatsapp-test-form";

/** The official WhatsApp API: whether it is set up, and from which number it sends. */
export async function CloudStatusCard({ view }: { view: CloudView }) {
	const t = await getTranslations("Admin.whatsapp.cloud");
	const tone =
		view.kind === "live"
			? "border-primary/40 text-primary"
			: view.kind === "unconfigured"
				? "border-border text-muted-foreground"
				: "border-destructive/40 text-destructive";

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<h2 className="flex items-center gap-2 text-sm font-semibold">
				{t("title")}
				<Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", tone)}>
					{t(`states.${view.kind}`)}
				</Badge>
			</h2>
			{view.kind === "live" ? (
				<>
					<div className="flex flex-col gap-0.5 text-sm">
						<p>
							{t.rich("number", {
								number: view.sender.display_phone_number,
								name: view.sender.verified_name,
								strong: (chunks) => (
									<strong className="font-semibold">{chunks}</strong>
								),
							})}
						</p>
						{view.sender.quality_rating && (
							<p className="text-xs text-muted-foreground">
								{t("quality", { rating: view.sender.quality_rating })}
							</p>
						)}
						<p className="text-xs text-muted-foreground">{t("templates")}</p>
					</div>
					<div className="border-t border-border pt-3">
						<WhatsappTestForm channel="CLOUD" />
					</div>
				</>
			) : (
				<p className="text-xs text-muted-foreground">
					{t(`hints.${view.kind}`)}
				</p>
			)}
		</section>
	);
}
