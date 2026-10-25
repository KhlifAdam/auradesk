import { ROLES } from "@/lib/auth/roles";
import type { ClientIdentity } from "@/services/portal/booking-queries";

/**
 * Who is talking to the assistant. A photographer works on their own studio;
 * a team member only sees the projects they are assigned to; in the portal,
 * anyone signed in is a client and only sees their own things.
 */
export type AssistantViewer =
	| { kind: "photographer"; userId: string; photographerId: string }
	| { kind: "team"; userId: string }
	| { kind: "client"; userId: string; identity: ClientIdentity };

/** The studio-side viewer for a signed-in user, or null for roles without one. */
export function toAssistantViewer(user: {
	id: string;
	role?: string | null;
}): AssistantViewer | null {
	if (user.role === ROLES.photographer)
		return { kind: "photographer", userId: user.id, photographerId: user.id };
	if (user.role === ROLES.team) return { kind: "team", userId: user.id };
	return null;
}

/** The portal viewer: every account can be someone's client. */
export function toClientViewer(user: ClientIdentity): AssistantViewer {
	return {
		kind: "client",
		userId: user.id,
		identity: {
			id: user.id,
			email: user.email,
			emailVerified: user.emailVerified,
			phoneNumber: user.phoneNumber,
			phoneNumberVerified: user.phoneNumberVerified,
		},
	};
}
