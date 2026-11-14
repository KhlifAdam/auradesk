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

	const { slug, name, tagline, bio, cover, logo } = result.site.studio;
	const title = tagline ? `${name} — ${tagline}` : name;
	// Search results and link previews show at most ~160 characters.
	const description =
		tagline || bio.replace(/\s+/g, " ").trim().slice(0, 160) || undefined;
	const image = cover ?? logo;
	const images = image
		? [{ url: image.url, width: image.width, height: image.height }]
		: undefined;
	return {
		title,
		description,
		alternates: { canonical: `/s/${slug}` },
		openGraph: {
			type: "website",
			url: `/s/${slug}`,
			siteName: name,
			title,
			description,
			images,
		},
		twitter: {
			card: image ? "summary_large_image" : "summary",
			title,
			description,
			images: images?.map((i) => i.url),
		},
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
