import { Store } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { SiteDesignWorkspace } from "@/components/dashboard/website/appearance/site-design-workspace";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { siteFontVariables } from "@/lib/public-site/fonts";
import { getSectionsEditorData } from "@/services/site-sections/queries";
import { getStudio } from "@/services/studio/queries";

export default async function AppearancePage({
	searchParams,
}: {
	searchParams: Promise<{ tab?: string | string[] }>;
}) {
	const t = await getTranslations("Site.appearance");
	const { photographerId } = await requirePhotographer();
	const [studio, sections, { tab }] = await Promise.all([
		getStudio(photographerId),
		getSectionsEditorData(photographerId),
		searchParams,
	]);

	return (
		<PageShell className={siteFontVariables}>
			<PageHeader title={t("title")} description={t("description")} />
			{studio && sections ? (
				<SiteDesignWorkspace
					studio={studio}
					sections={sections}
					initialTab={tab === "sections" ? "sections" : "style"}
					siteUrl={studio.published ? `/s/${studio.slug}` : null}
				/>
			) : (
				<EmptyState
					icon={Store}
					title={t("noStudio.title")}
					description={t("noStudio.description")}
					action={
						<Button asChild size="sm">
							<Link href="/dashboard/site">{t("noStudio.action")}</Link>
						</Button>
					}
				/>
			)}
		</PageShell>
	);
}
