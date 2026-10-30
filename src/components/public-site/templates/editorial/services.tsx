import { ArrowRight } from "lucide-react";
import type { SiteData } from "@/services/public-site/types";
import {
	getPackageFormatters,
	PackageDeliverables,
} from "../../shared/package-parts";
import { Reveal } from "../../shared/reveal";

/** Numbered rows, like a menu: name and story, what's included, the price. */
export async function EditorialServices({ site }: { site: SiteData }) {
	const { t, price, meta } = await getPackageFormatters(site.i18n.locale);

	return (
		<section id="services" className="site-card px-6 py-24 md:px-12 md:py-32">
			<div className="mx-auto max-w-7xl">
				<Reveal className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
					<div className="flex flex-col gap-3">
						<span className="site-accent-text text-xs font-semibold uppercase tracking-[0.3em]">
							{t("eyebrow")}
						</span>
						<h2 className="site-heading text-5xl tracking-tight md:text-6xl">
							{t("title")}
						</h2>
					</div>
					<p className="site-muted max-w-sm text-lg">{t("subtitle")}</p>
				</Reveal>

				<div className="site-border flex flex-col border-t">
					{site.packages.map((pkg, index) => (
						<Reveal key={pkg.id} delay={index * 0.06}>
							<article className="site-border group grid gap-6 border-b py-10 transition-colors md:grid-cols-12 md:items-start md:px-4 md:hover:bg-[var(--s-bg)]">
								<span className="site-heading site-muted text-2xl md:col-span-1">
									{String(index + 1).padStart(2, "0")}
								</span>
								<div className="flex flex-col gap-3 md:col-span-4">
									<div className="flex flex-wrap items-center gap-3">
										<h3 className="site-heading text-3xl">{pkg.name}</h3>
										{pkg.featured && (
											<span className="site-accent-bg rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">
												{t("featured")}
											</span>
										)}
									</div>
									<p className="site-muted leading-relaxed">
										{pkg.description}
									</p>
								</div>
								<PackageDeliverables
									items={pkg.deliverables}
									className="md:col-span-4"
								/>
								<div className="flex flex-col gap-3 md:col-span-3 md:items-end md:text-right">
									<span className="site-heading text-4xl">{price(pkg)}</span>
									<span className="site-muted text-xs uppercase tracking-wider">
										{meta(pkg)}
									</span>
									<a
										href="#contact"
										className="inline-flex items-center gap-2 text-sm font-medium underline decoration-[var(--s-accent)] underline-offset-8"
									>
										{t("enquire")}
										<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
									</a>
								</div>
							</article>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}
