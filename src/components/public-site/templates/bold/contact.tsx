import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { SiteData } from "@/services/public-site/types";
import { BookingRequest } from "../../shared/booking-request";
import { ContactDetails, SocialLinks } from "../../shared/contact-parts";
import { Reveal } from "../../shared/reveal";

/** Giant call to action with the email as the hero. */
export async function BoldContact({ site }: { site: SiteData }) {
	const { studio, i18n } = site;
	const t = await getTranslations({
		locale: i18n.locale,
		namespace: "PublicSite.contact",
	});

	return (
		<section id="contact" className="site-card px-6 py-24 md:px-12 md:py-32">
			<Reveal className="flex flex-col gap-10">
				<span className="site-accent-text text-xs font-bold uppercase tracking-[0.35em]">
					{t("eyebrow")}
				</span>
				<h2 className="site-heading text-5xl font-bold uppercase leading-[0.85] tracking-tighter sm:text-6xl md:text-[9vw]">
					{t("title")}
				</h2>
				<div className="site-border flex flex-col justify-between gap-10 border-t pt-10 md:flex-row md:items-end">
					<div className="flex flex-col gap-6">
						<p className="site-muted max-w-md text-lg">{t("subtitle")}</p>
						{studio.email && (
							<a
								href={`mailto:${studio.email}`}
								className="site-heading group inline-flex items-center gap-3 text-2xl font-bold tracking-tight transition-colors hover:text-[var(--s-accent)] md:text-4xl"
							>
								{studio.email}
								<ArrowUpRight className="h-7 w-7 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
							</a>
						)}
						<ContactDetails
							studio={{ ...studio, email: "" }}
							className="site-muted flex flex-wrap gap-x-8 gap-y-3 text-sm"
						/>
					</div>
					<div className="flex flex-col items-start gap-6 md:items-end">
						{studio.bookingEnabled && (
							<BookingRequest
								email={studio.email}
								className="site-accent-bg inline-flex h-14 items-center px-10 text-sm font-bold uppercase tracking-[0.25em] transition-transform hover:-translate-y-0.5"
							>
								{t("cta")}
							</BookingRequest>
						)}
						<SocialLinks
							studio={studio}
							locale={i18n.locale}
							className="flex flex-wrap gap-2"
							linkClassName="site-border flex items-center gap-2 border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors hover:border-[var(--s-accent)] hover:text-[var(--s-accent)]"
						/>
					</div>
				</div>
			</Reveal>
		</section>
	);
}
