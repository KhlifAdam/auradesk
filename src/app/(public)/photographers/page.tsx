import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CTA } from "@/components/landing/cta";
import { FAQ } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Logos } from "@/components/landing/logos";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { Workflow } from "@/components/landing/workflow";
import { SpaceBackdrop } from "@/components/shared/space-backdrop";
import { BRAND_NAME } from "@/lib/brand";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Home.photographer");
	return { title: `${BRAND_NAME} | ${t("metaTitle")}` };
}

/** The studio side's presentation; its calls to action lead to the photographer sign-up and sign-in. */
export default function PhotographersPage() {
	return (
		<main className="relative isolate min-h-screen overflow-x-clip bg-background text-foreground selection:bg-primary/20">
			<SpaceBackdrop className="fixed" />
			<div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] grid-fade opacity-60" />

			<Header />
			<Hero />
			<Logos />
			<Features />
			<Workflow />
			<Testimonials />
			<Pricing />
			<FAQ />
			<CTA />
			<Footer />
		</main>
	);
}
