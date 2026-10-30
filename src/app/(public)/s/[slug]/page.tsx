import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SiteRenderer } from "@/components/public-site/site-renderer";
import { getLocaleCandidates } from "@/lib/public-site/locale-candidates";
import { getPublicSite } from "@/services/public-site/queries";

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function localeCandidates(searchParams: Props["searchParams"]) {
	return getLocaleCandidates((await searchParams).lang);
}

export async function generateMetadata({
	params,
	searchParams,
}: Props): Promise<Metadata> {
	const result = await getPublicSite(
		(await params).slug,
		await localeCandidates(searchParams),
	);
	if (result.status !== "live") return { robots: { index: false } };

	const { name, tagline } = result.site.studio;
	return {
		title: tagline ? `${name} — ${tagline}` : name,
		description: tagline || undefined,
	};
}

/** A photographer's public site, exactly as rendered in the dashboard preview. */
export default async function PublicSitePage({ params, searchParams }: Props) {
	const result = await getPublicSite(
		(await params).slug,
		await localeCandidates(searchParams),
	);
	if (result.status === "missing") notFound();

	if (result.status === "draft" || result.status === "suspended") {
		const t = await getTranslations(
			result.status === "draft"
				? "PublicSite.comingSoon"
				: "PublicSite.unavailable",
		);
		return (
			<main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
				<h1 className="font-display text-3xl font-bold">
					{t("title", { name: result.name })}
				</h1>
				<p className="max-w-md text-sm text-muted-foreground">
					{t("description")}
				</p>
			</main>
		);
	}

	return <SiteRenderer site={result.site} />;
}
