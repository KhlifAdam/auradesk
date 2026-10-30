import { cn } from "@/lib/utils";
import type { SiteData } from "@/services/public-site/types";
import {
	getPackageFormatters,
	PackageDeliverables,
} from "../../shared/package-parts";
import { Reveal } from "../../shared/reveal";

/** Airy cards; the featured package is raised and outlined in the accent. */
export async function MinimalServices({ site }: { site: SiteData }) {
	const { t, price, meta } = await getPackageFormatters(site.i18n.locale);

	return (
		<section id="services" className="site-card px-6 py-24 md:px-8 md:py-32">
			<div className="mx-auto max-w-6xl">
				<Reveal className="mb-14 flex flex-col items-center gap-4 text-center">
					<span className="site-accent-text text-xs font-semibold uppercase tracking-[0.3em]">
						{t("eyebrow")}
					</span>
					<h2 className="site-heading text-4xl tracking-tight md:text-5xl">
						{t("title")}
					</h2>
					<p className="site-muted max-w-xl text-lg">{t("subtitle")}</p>
				</Reveal>

				<div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
					{site.packages.map((pkg, index) => (
						<Reveal key={pkg.id} delay={index * 0.08} className="h-full">
							<article
								className={cn(
									"relative flex h-full flex-col gap-6 rounded-2xl border bg-[var(--s-bg)] p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5",
									pkg.featured
										? "site-accent-border border-2 xl:-translate-y-3"
										: "site-border",
								)}
							>
								{pkg.featured && (
									<span className="site-accent-bg absolute -top-3 left-7 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">
										{t("featured")}
									</span>
								)}
								<div className="flex flex-col gap-2">
									<h3 className="site-heading text-xl">{pkg.name}</h3>
									<p className="site-muted text-sm leading-relaxed">
										{pkg.description}
									</p>
								</div>
								<div className="flex items-baseline gap-2">
									<span className="site-heading text-4xl tracking-tight">
										{price(pkg)}
									</span>
									<span className="site-muted text-xs">{meta(pkg)}</span>
								</div>
								<PackageDeliverables
									items={pkg.deliverables}
									className="site-border border-t pt-6"
								/>
								<a
									href="#contact"
									className={cn(
										"mt-auto inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition-opacity hover:opacity-85",
										pkg.featured ? "site-accent-bg" : "site-border border",
									)}
								>
									{t("enquire")}
								</a>
							</article>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}
