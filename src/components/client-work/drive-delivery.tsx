import { ExternalLink, HardDrive, Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

/**
 * A delivery hosted on Google Drive, as the client sees it: a button to open
 * it once the project is delivered and paid, a padlock before.
 */
export async function DriveDelivery({
	url,
	studioName,
}: {
	url: string | null;
	studioName: string | null;
}) {
	const t = await getTranslations("Portal.drive");

	return (
		<section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-drive/10 via-card to-success/10 p-6 text-center">
			<div className="mx-auto flex max-w-md flex-col items-center gap-3">
				<span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-drive shadow-sm ring-1 ring-border">
					<HardDrive className="h-7 w-7" />
				</span>
				{url ? (
					<>
						<h2 className="font-display text-lg font-semibold">{t("title")}</h2>
						<p className="text-sm text-muted-foreground">
							{t("body", { studio: studioName ?? "" })}
						</p>
						<Button asChild size="lg" className="mt-1 gap-2">
							<a href={url} target="_blank" rel="noopener noreferrer">
								<ExternalLink className="h-4 w-4" />
								{t("open")}
							</a>
						</Button>
						<p className="text-[11px] text-muted-foreground">{t("tip")}</p>
					</>
				) : (
					<>
						<h2 className="font-display text-lg font-semibold">
							{t("lockedTitle")}
						</h2>
						<p className="flex items-center gap-1.5 text-sm text-muted-foreground">
							<Lock className="h-3.5 w-3.5 shrink-0" />
							{t("locked")}
						</p>
					</>
				)}
			</div>
		</section>
	);
}
