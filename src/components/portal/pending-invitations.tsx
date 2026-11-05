import { getTranslations } from "next-intl/server";
import { requireClient } from "@/lib/auth/require-client";
import { realEmail } from "@/lib/phone";
import { verifiedContact } from "@/services/portal/contacts";
import {
	countPendingInvitations,
	listPendingInvitations,
} from "@/services/portal/queries";
import { AttentionPanel } from "./attention-panel";
import { InvitationCard } from "./invitation-card";
import { VerifyEmailCard } from "./verify-email-card";

/** Invitations for the contacts the signed-in client has verified. */
export async function PendingInvitations() {
	const t = await getTranslations("Portal.invitations");
	const { session } = await requireClient();
	const { user } = session;
	const contact = verifiedContact(user);
	const realAddress = realEmail(user.email);

	// An unverified email only gets a prompt; details wait for the code.
	const unverifiedCount =
		realAddress && !user.emailVerified
			? await countPendingInvitations(realAddress)
			: 0;
	const invitations =
		contact.email || contact.phone ? await listPendingInvitations(contact) : [];

	return (
		<>
			{realAddress && unverifiedCount > 0 && (
				<VerifyEmailCard email={realAddress} count={unverifiedCount} />
			)}
			{invitations.length > 0 && (
				<AttentionPanel
					id="invitations"
					title={t("title", { count: invitations.length })}
				>
					{invitations.map((invitation) => (
						<InvitationCard key={invitation.id} invitation={invitation} />
					))}
				</AttentionPanel>
			)}
		</>
	);
}
