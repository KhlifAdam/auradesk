import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SiteShell } from "@/components/public-site/shared/site-shell";
import {
	initialSiteTheme,
	siteStyle,
} from "@/components/public-site/site-theme";
import { TEMPLATE_REGISTRY } from "@/components/public-site/templates/registry";
import { AUTH_PATHS } from "@/lib/auth/client-intent";
import { siteFontVariables } from "@/lib/public-site/fonts";
import { cn } from "@/lib/utils";
import type { SiteData } from "@/services/public-site/types";
import { WelcomeCard, type WelcomeTone } from "./welcome-card";

const TONE: WelcomeTone = {
	card: "site-glass site-border site-fg site-body",
	heading: "site-heading",
	muted: "site-muted",
	accent: "site-accent-text",
	primary: "site-accent-bg hover:opacity-90",
	secondary: "site-border site-fg border hover:site-card",
};

/**
 * Welcome of one studio's client space: the studio's own cover, logo, colours
 * and fonts, in the language of its public site.
 */
export async function StudioWelcome({ site }: { site: SiteData }) {
	const { design, i18n, studio } = site;
	const { palette } = TEMPLATE_REGISTRY[design.template];
	const t = await getTranslations({
		locale: i18n.locale,
		namespace: "ClientWelcome",
	});
	const vars = { studio: studio.name };

	return (
		<SiteShell
			mode={design.themeMode}
			initialTheme={initialSiteTheme(design.themeMode)}
			storageKey={`auradesk-site-theme:${studio.name}`}
			studioSlug={studio.slug}
			lang={i18n.locale}
			style={siteStyle(design, palette)}
			className={cn(
				siteFontVariables,
				"site-bg site-fg site-body relative isolate flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-10 antialiased",
			)}
		>
			{studio.cover && (
				<>
					<Image
						src={studio.cover.url}
						alt={studio.cover.alt}
						fill
						priority
						sizes="100vw"
						className="-z-20 object-cover"
					/>
					<div className="site-bg absolute inset-0 -z-10 opacity-60" />
				</>
			)}
			<WelcomeCard
				tone={TONE}
				brand={
					<>
						{studio.logo && (
							<Image
								src={studio.logo.url}
								alt=""
								width={44}
								height={44}
								className="h-11 w-11 rounded-full object-cover"
							/>
						)}
						<span className="site-heading text-base font-semibold">
							{studio.name}
						</span>
					</>
				}
				title={t("title", vars)}
				subtitle={studio.tagline || t("subtitle")}
				points={t.raw("points") as string[]}
				hint={t("hint")}
				signIn={{ href: AUTH_PATHS.client.login, label: t("signIn") }}
				createAccount={{
					href: AUTH_PATHS.client.register,
					label: t("createAccount"),
				}}
				back={{
					href: `/s/${studio.slug}?lang=${i18n.locale}`,
					label: t("backToSite", vars),
				}}
			/>
		</SiteShell>
	);
}
