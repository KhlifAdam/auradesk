import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteData } from "@/services/public-site/types";
import {
	getPackageFormatters,
	PackageDeliverables,
} from "../../shared/package-parts";
import { Reveal } from "../../shared/reveal";

/** Numbered hard-edged cards; the featured package is flooded with the accent. */
export async function BoldServices({ site }: { site: SiteData }) {
	const { t, price, meta } = await getPackageFormatters(site.i18n.locale);

	return (
		<section id="services" className="site-card px-6 py-24 md:px-12 md:py-32">
			<Reveal className="mb-14 flex flex-col gap-3">
				<span className="site-accent-text text-xs font-bold uppercase tracking-[0.35em]">
					{t("eyebrow")}
				</span>
				<h2 className="site-heading pt-[0.12em] text-5xl font-bold uppercase leading-[0.9] tracking-tighter md:text-8xl">
					{t("title")}
				</h2>
			</Reveal>

			<div className="grid gap-px overflow-hidden border border-[var(--s-border)] bg-[var(--s-border)] md:grid-cols-2 xl:grid-cols-4">
				{site.packages.map((pkg, index) => (
					<article
						key={pkg.id}
						className={cn(
							"group flex flex-col gap-8 p-8 transition-colors duration-500",
							pkg.featured
								? "site-accent-bg"
								: "site-bg hover:bg-[var(--s-card)]",
						)}
					>
						<div className="flex items-start justify-between gap-4">
							<span className="site-heading text-5xl font-bold opacity-30">
								{String(index + 1).padStart(2, "0")}
							</span>
							{pkg.featured && (
								<span className="border border-current px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
									{t("featured")}
								</span>
							)}
						</div>
						<div className="flex flex-col gap-3">
							<h3 className="site-heading text-2xl font-bold uppercase tracking-tight">
								{pkg.name}
							</h3>
							<p
								className={cn(
									"text-sm leading-relaxed",
									!pkg.featured && "site-muted",
								)}
							>
								{pkg.description}
							</p>
						</div>
						<div className="flex items-baseline gap-2">
							<span className="site-heading text-5xl font-bold tracking-tighter">
								{price(pkg)}
							</span>
							<span className="text-xs uppercase tracking-wider opacity-70">
								{meta(pkg)}
							</span>
						</div>
						<PackageDeliverables
							items={pkg.deliverables}
							className={cn(pkg.featured && "[&_svg]:text-current")}
						/>
						<a
							href="#contact"
							className="mt-auto inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em]"
						>
							{t("enquire")}
							<ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
						</a>
					</article>
				))}
			</div>
		</section>
	);
}
