import { Store } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AvatarEditor } from "@/components/account/avatar-editor";
import { LinkCard } from "@/components/account/link-card";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import {
	EmailContact,
	PhoneContact,
} from "@/components/portal/account/account-contacts";
import { AccountNameForm } from "@/components/portal/account/account-name-form";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { realEmail } from "@/lib/phone";

/** The photographer as a person: photo, name, and how to reach them. */
export default async function ProfilePage() {
	const t = await getTranslations("Account");
	const { session } = await requirePhotographer();
	const { user } = session;

	return (
		<PageShell>
			<PageHeader
				title={t("profile.title")}
				description={t("profile.description")}
			/>
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
					href="/dashboard/site"
					icon={Store}
					title={t("profile.studioTitle")}
					description={t("profile.studioHint")}
				/>
			</div>
		</PageShell>
	);
}
