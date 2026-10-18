import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AccountDataCard } from "@/components/account/account-data-card";
import { ConnectedAccountsCard } from "@/components/account/connected-accounts-card";
import { PasswordCard } from "@/components/account/password-card";
import { PreferencesCard } from "@/components/account/preferences-card";
import { SessionsCard } from "@/components/account/sessions-card";
import { requireClient } from "@/lib/auth/require-client";
import { ROLES } from "@/lib/auth/roles";
import { enabledSocialProviders } from "@/lib/auth/social-providers";
import { getSecurityOverview } from "@/services/account/queries";

/** The client's preferences, sign-in, devices, and their data. */
export default async function PortalSettingsPage() {
	const t = await getTranslations("Account");
	const tPortal = await getTranslations("Portal.account");
	const { session } = await requireClient();
	const security = await getSecurityOverview(
		session.user.id,
		session.session.id,
	);

	return (
		<>
			<div className="flex flex-col gap-1">
				<Link
					href="/portal"
					className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					{tPortal("back")}
				</Link>
				<h1 className="font-display text-2xl font-bold tracking-tight">
					{t("settings.title")}
				</h1>
				<p className="text-sm text-muted-foreground">
					{t("settings.description")}
				</p>
			</div>
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
				<AccountDataCard studio={session.user.role === ROLES.photographer} />
			</div>
		</>
	);
}
