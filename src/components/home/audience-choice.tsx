import { Camera, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/landing/brand-mark";
import { AUTH_PATHS } from "@/lib/auth/client-intent";
import { AudienceCard } from "./audience-card";

/** The two ways in, joined by the brand: one platform, two connected spaces. */
export function AudienceChoice() {
	const t = useTranslations("Home");

	return (
		<section
			id="spaces"
			className="relative mx-auto max-w-6xl scroll-mt-10 px-5 pb-8"
		>
			<div className="relative grid gap-6 md:grid-cols-2 md:gap-10">
				<AudienceCard
					side="studio"
					href={AUTH_PATHS.photographer.welcome}
					icon={Camera}
					image="/images/auradesk-portrait.jpg"
					imageAlt={t("photographer.imageAlt")}
					label={t("photographer.label")}
					title={t("photographer.title")}
					description={t("photographer.description")}
					points={t.raw("photographer.points") as string[]}
					cta={t("photographer.cta")}
				/>
				<AudienceCard
					side="client"
					href={AUTH_PATHS.client.welcome}
					icon={UserRound}
					image="/images/auradesk-gallery.jpg"
					imageAlt={t("client.imageAlt")}
					label={t("client.label")}
					title={t("client.title")}
					description={t("client.description")}
					points={t.raw("client.points") as string[]}
					cta={t("client.cta")}
				/>

				{/* Connector between the two cards (desktop): shows they share one platform. */}
				<div className="pointer-events-none absolute left-1/2 top-[32%] hidden -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 md:flex">
					<span className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background/90 shadow-2xl ring-8 ring-background/60 backdrop-blur-xl">
						<BrandMark />
					</span>
					<span className="rounded-full border border-border bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
						{t("connector")}
					</span>
				</div>
			</div>
		</section>
	);
}
