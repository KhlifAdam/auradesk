import "server-only";

import { requireClient } from "@/lib/auth/require-client";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import type { MessageRole, Viewer } from "./viewer";

/** The signed-in user, on the side of the conversation they write from. */
export async function resolveViewer(role: MessageRole): Promise<Viewer> {
	if (role === "photographer")
		return { id: (await requirePhotographer()).photographerId, role };
	return { id: (await requireClient()).clientId, role };
}
