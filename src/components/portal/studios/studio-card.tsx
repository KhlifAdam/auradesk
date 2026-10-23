import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { NewRequestDialog } from "@/components/portal/home/new-request-dialog";
import { PortfolioLink } from "@/components/portal/portfolio-link";
import { StudioHeading } from "@/components/portal/studio-heading";
import { Button } from "@/components/ui/button";
import type { PortalStudio } from "@/services/portal/studio-queries";

/** One photographer the client works with, and what they can do with them. */
export async function StudioCard({ studio }: { studio: PortalStudio }) {
	const t = await getTranslations("Portal.studios");
	const format = await getFormatter();
	const name = studio.studio?.name ?? studio.photographerName;

	return (
		<article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/40">
			<StudioHeading
				studio={studio.studio}
				fallbackName={studio.photographerName}
			/>
			<div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
				<p>
					{t("counts", {
						projects: studio.projectCount,
						bookings: studio.bookingCount,
					})}
				</p>
				{studio.lastActivity && (
					<p>
						{t("lastActivity", {
							date: format.dateTime(new Date(studio.lastActivity), {
								dateStyle: "medium",
							}),
						})}
					</p>
				)}
			</div>
			<div className="mt-auto flex flex-wrap gap-2">
				{studio.studio?.published && (
					<PortfolioLink slug={studio.studio.slug} />
				)}
				<Button
					asChild
					variant="outline"
					size="sm"
					className="h-8 gap-1.5 text-xs"
				>
					<Link href={`/portal/messages?studio=${studio.photographerId}`}>
						<MessageSquare className="h-3.5 w-3.5" />
						{t("message")}
					</Link>
				</Button>
				<NewRequestDialog
					studios={[{ photographerId: studio.photographerId, name }]}
				/>
			</div>
		</article>
	);
}
