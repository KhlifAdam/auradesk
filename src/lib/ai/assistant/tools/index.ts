import "server-only";

import type { InferUITools, UIDataTypes, UIMessage } from "ai";
import type { Locale } from "@/i18n/config";
import type { AssistantViewer } from "../viewer";
import { WRITE_TOOLS } from "../write-tools";
import { bookingTools } from "./bookings";
import { clientSpaceTools } from "./client-space";
import { clientTools } from "./clients";
import { insightTools } from "./insights";
import { invoiceTools } from "./invoices";
import { planningTools } from "./planning";
import { projectTools } from "./projects";
import { teamSpaceTools } from "./team-space";

interface ToolContext {
	locale: Locale;
	timeZone: string;
}

/** Everything a photographer's assistant can look up or propose. */
function photographerTools(photographerId: string, ctx: ToolContext) {
	return {
		...clientTools(photographerId),
		...projectTools(photographerId),
		...bookingTools(photographerId),
		...invoiceTools(photographerId),
		...insightTools({ photographerId, ...ctx }),
		...planningTools(photographerId),
		// No `execute`: the browser runs these after the user's go-ahead.
		...WRITE_TOOLS,
	};
}

/**
 * The tools for this viewer. Ids come from the session, never from the model,
 * so every lookup stays inside the viewer's own data.
 */
export function buildAssistantTools(viewer: AssistantViewer, ctx: ToolContext) {
	if (viewer.kind === "photographer")
		return photographerTools(viewer.photographerId, ctx);
	if (viewer.kind === "client") return clientSpaceTools(viewer.identity);
	return teamSpaceTools(viewer.userId);
}

type AssistantTools = ReturnType<typeof photographerTools> &
	ReturnType<typeof teamSpaceTools> &
	ReturnType<typeof clientSpaceTools>;

export type AssistantUIMessage = UIMessage<
	never,
	UIDataTypes,
	InferUITools<AssistantTools>
>;
