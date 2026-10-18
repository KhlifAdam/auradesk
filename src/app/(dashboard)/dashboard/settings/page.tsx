import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ConnectedAccountsCard } from "@/components/account/connected-accounts-card";
import { LinkCard } from "@/components/account/link-card";
import { PasswordCard } from "@/components/account/password-card";
import { PreferencesCard } from "@/components/account/preferences-card";
import { SessionsCard } from "@/components/account/sessions-card";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { enabledSocialProviders } from "@/lib/auth/social-providers";
import { getSecurityOverview } from "@/services/account/queries";

/** Preferences, how the account signs in, and where it is signed in. */
export default async function SettingsPage() {
	const t = await getTranslations("Account");
	const { session } = await requirePhotographer();
	const security = await getSecurityOverview(
		session.user.id,
		session.session.id,
	);

	return (
		<PageShell>
			<PageHeader
				title={t("settings.title")}
				description={t("settings.description")}
			/>
			<div className="flex max-w-2xl flex-col gap-3">
				<PreferencesCard />
				{security.hasPassword && <PasswordCard />}
				<ConnectedAccountsCard
					providers={enabledSocialProviders}
					linked={security.linked}
				/>
				<SessionsCard
					sessions={security.sessions}
					now={new Date().toISOString()}
				/>
				<LinkCard
					href="/dashboard/privacy"
					icon={ShieldCheck}
					title={t("settings.privacyTitle")}
					description={t("settings.privacyHint")}
				/>
			</div>
		</PageShell>
	);
}
