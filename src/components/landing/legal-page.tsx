import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Footer } from "./footer";
import { Header } from "./header";

export type LegalDocumentId = "privacy" | "terms";

interface LegalSection {
	title: string;
	paragraphs?: string[];
	items?: string[];
}

/**
 * A legal document (privacy policy, terms) in the landing page's frame.
 * The text lives in `Legal.{document}` so both languages stay in step.
 */
export async function LegalPage({ document }: { document: LegalDocumentId }) {
	const t = await getTranslations("Legal");
	const sections = t.raw(`${document}.sections`) as LegalSection[];

	return (
		<main className="min-h-screen bg-background text-foreground selection:bg-primary/20">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] mesh-glow opacity-60" />
			<Header />
			<article className="relative mx-auto max-w-3xl px-5 pb-20 pt-32 md:pt-40">
				<Link
					href="/photographers"
					className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					{t("back")}
				</Link>
				<h1 className="mt-6 font-display text-4xl font-semibold md:text-5xl">
					{t(`${document}.title`)}
				</h1>
				<p className="mt-3 text-xs text-muted-foreground">{t("updated")}</p>
				<p className="mt-8 text-base leading-relaxed text-muted-foreground">
					{t(`${document}.intro`)}
				</p>

				<div className="mt-12 flex flex-col gap-10">
					{sections.map((section, index) => (
						<section key={section.title} className="flex flex-col gap-3">
							<h2 className="font-display text-lg font-semibold">
								<span className="mr-2 text-primary">{index + 1}.</span>
								{section.title}
							</h2>
							{section.paragraphs?.map((paragraph) => (
								<p
									key={paragraph}
									className="text-sm leading-relaxed text-muted-foreground"
								>
									{paragraph}
								</p>
							))}
							{section.items && (
								<ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
									{section.items.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							)}
						</section>
					))}
				</div>
			</article>
			<Footer />
		</main>
	);
}
