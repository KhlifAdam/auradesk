"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { SectionKind } from "@/services/site-sections/schemas";
import { LiveSitePreview } from "./live-site-preview";

/** Live miniature of the site with the current (unsaved) choices. */
export function AppearancePreviewPanel({
	query,
	focus,
}: {
	/** Preview query string: unsaved style and, while editing, the draft. */
	query: string;
	/** The section to bring into view. */
	focus?: SectionKind;
}) {
	const t = useTranslations("Site.appearance.preview");

	return (
		<div className="flex flex-col gap-2 xl:sticky xl:top-5 xl:self-start">
			<div className="flex items-center justify-between gap-2">
				<span className="text-xs font-medium text-muted-foreground">
					{t("title")}
				</span>
				<Button
					asChild
					variant="outline"
					size="sm"
					className="h-7 gap-1.5 text-xs"
				>
					<Link href={`/preview?${query}`} target="_blank">
						<Eye className="h-3.5 w-3.5" />
						{t("open")}
					</Link>
				</Button>
			</div>
			<LiveSitePreview src={`/preview/frame?${query}`} focus={focus} />
			<p className="text-[11px] text-muted-foreground">{t("hint")}</p>
		</div>
	);
}
