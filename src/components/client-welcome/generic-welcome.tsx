import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { AUTH_PATHS } from "@/lib/auth/client-intent";
import { BRAND_NAME } from "@/lib/brand";
import { WelcomeCard, type WelcomeTone } from "./welcome-card";

const TONE: WelcomeTone = {
	card: "border-border bg-card/80 text-card-foreground",
	heading: "font-display",
	muted: "text-muted-foreground",
	accent: "text-primary",
	primary: "bg-primary text-primary-foreground hover:bg-primary/90",
	secondary: "border border-border hover:bg-muted",
};

/** Shown when the visitor doesn't come from a studio's site (or it isn't live). */
export async function GenericWelcome() {
	const t = await getTranslations("ClientWelcome");

	return (
		<main className="relative isolate flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-background px-4 py-10">
			<Image
				src="/images/auradesk-gallery.jpg"
				alt=""
				fill
				loading="eager"
				fetchPriority="high"
				sizes="100vw"
				className="-z-20 object-cover"
			/>
			<div className="absolute inset-0 -z-10 bg-background/70" />
			<WelcomeCard
				tone={TONE}
				brand={
					<span className="font-display text-base font-semibold">
						{BRAND_NAME}
					</span>
				}
				title={t("genericTitle")}
				subtitle={t("subtitle")}
				points={t.raw("points") as string[]}
				hint={t("hint")}
				signIn={{ href: AUTH_PATHS.client.login, label: t("signIn") }}
				createAccount={{
					href: AUTH_PATHS.client.register,
					label: t("createAccount"),
				}}
				back={{ href: "/", label: t("backHome") }}
			/>
		</main>
	);
}
