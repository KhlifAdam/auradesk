"use client";

import { AssistantProvider } from "@/components/assistant/assistant-provider";
import { PortalAssistantLauncher } from "./portal-assistant-launcher";
import { PortalAssistantPanel } from "./portal-assistant-panel";

/** The client's assistant: a lively floating button and a chat that opens over the portal. */
export function PortalAssistant() {
	return (
		<AssistantProvider
			initialOpen={false}
			basePath="/portal/assistant"
			remembersOpen={false}
		>
			<PortalAssistantLauncher />
			<PortalAssistantPanel />
		</AssistantProvider>
	);
}
