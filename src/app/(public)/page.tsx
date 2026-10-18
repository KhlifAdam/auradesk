import { getTranslations } from "next-intl/server";
import { AudienceChoice } from "@/components/home/audience-choice";
import { HomeFinalCta } from "@/components/home/home-final-cta";
import { HomeHeader } from "@/components/home/home-header";
import { HomeHero } from "@/components/home/home-hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { BRAND_NAME } from "@/lib/brand";

/**
 * AuraDesk's front door, for both sides of the platform. Each card leads to
 * that side's own presentation, whose "get started" reaches only its login.
 */
export default async function HomePage() {
	const t = await getTranslations("Home");

	return (
		<main className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/20">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-[1000px] mesh-glow" />
			<div className="pointer-events-none absolute inset-x-0 top-0 h-[820px] grid-fade opacity-50 [mask-image:radial-gradient(ellipse_at_top,black_35%,transparent_75%)]" />

			<HomeHeader />
			<HomeHero />
			<AudienceChoice />
			<HowItWorks />
			<HomeFinalCta />

			<footer className="mx-auto max-w-6xl border-t border-border px-5 py-8 text-center text-[11px] text-muted-foreground">
				{t("copyright", { brand: BRAND_NAME, year: new Date().getFullYear() })}
			</footer>
		</main>
	);
}
