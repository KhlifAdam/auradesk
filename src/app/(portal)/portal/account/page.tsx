import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AvatarEditor } from "@/components/account/avatar-editor";
import { LinkCard } from "@/components/account/link-card";
import {
	EmailContact,
	PhoneContact,
} from "@/components/portal/account/account-contacts";
import { AccountNameForm } from "@/components/portal/account/account-name-form";
import { requireClient } from "@/lib/auth/require-client";
import { realEmail } from "@/lib/phone";

/** The client's profile: photo, name, and the ways to reach them. */
export default async function AccountPage() {
	const t = await getTranslations("Portal.account");
	const tAccount = await getTranslations("Account");
	const { session } = await requireClient();
	const { user } = session;

	return (
		<>
			<div className="flex flex-col gap-1">
				<Link
					href="/portal"
					className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					{t("back")}
				</Link>
				<h1 className="font-display text-2xl font-bold tracking-tight">
					{tAccount("profile.title")}
				</h1>
				<p className="text-sm text-muted-foreground">{t("description")}</p>
			</div>
			<div className="flex max-w-2xl flex-col gap-3">
				<AvatarEditor name={user.name} image={user.image ?? null} />
				<AccountNameForm name={user.name} />
				<EmailContact
					email={realEmail(user.email)}
					verified={user.emailVerified}
				/>
				<PhoneContact
					phone={user.phoneNumber ?? null}
					verified={Boolean(user.phoneNumberVerified)}
				/>
				<LinkCard
					href="/portal/settings"
					icon={Settings}
					title={tAccount("settings.title")}
					description={tAccount("settings.clientHint")}
				/>
			</div>
		</>
	);
}
