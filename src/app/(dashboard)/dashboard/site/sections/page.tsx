import { Store } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { SectionsEditor } from "@/components/dashboard/website/sections/sections-editor";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { getSectionsEditorData } from "@/services/site-sections/queries";

export default async function SiteSectionsPage() {
	const t = await getTranslations("Site.sections");
	const tAppearance = await getTranslations("Site.appearance");
	const { photographerId } = await requirePhotographer();
	const [data, studio] = await Promise.all([
		getSectionsEditorData(photographerId),
		db.studio.findUnique({
			where: { photographerId },
			select: { slug: true, published: true },
		}),
	]);

	return (
		<PageShell>
			<PageHeader title={t("title")} description={t("description")} />
			{data ? (
				<SectionsEditor
					data={data}
					siteUrl={studio?.published ? `/s/${studio.slug}` : null}
				/>
			) : (
				<EmptyState
					icon={Store}
					title={tAppearance("noStudio.title")}
					description={tAppearance("noStudio.description")}
					action={
						<Button asChild size="sm">
							<Link href="/dashboard/site">
								{tAppearance("noStudio.action")}
							</Link>
						</Button>
					}
				/>
			)}
		</PageShell>
	);
}
