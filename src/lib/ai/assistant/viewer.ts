import { ROLES } from "@/lib/auth/roles";

/**
 * Who is talking to the assistant. A photographer works on their own studio;
 * a team member only sees the projects they are assigned to.
 */
export type AssistantViewer =
	| { kind: "photographer"; userId: string; photographerId: string }
	| { kind: "team"; userId: string };

/** The viewer for a signed-in user, or null for roles without an assistant. */
export function toAssistantViewer(user: {
	id: string;
	role?: string | null;
}): AssistantViewer | null {
	if (user.role === ROLES.photographer)
		return { kind: "photographer", userId: user.id, photographerId: user.id };
	if (user.role === ROLES.team) return { kind: "team", userId: user.id };
	return null;
}
