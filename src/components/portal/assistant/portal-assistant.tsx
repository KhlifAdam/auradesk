"use client";

import type { ReactNode } from "react";
import {
	AssistantProvider,
	useAssistant,
} from "@/components/assistant/assistant-provider";
import { cn } from "@/lib/utils";
import { PortalAssistantLauncher } from "./portal-assistant-launcher";
import { PortalAssistantPanel } from "./portal-assistant-panel";

/** Shared state of the client's assistant; wraps the whole portal layout. */
export function PortalAssistantProvider({ children }: { children: ReactNode }) {
	return (
		<AssistantProvider
			initialOpen={false}
			basePath="/portal/assistant"
			remembersOpen={false}
		>
			{children}
		</AssistantProvider>
	);
}

/** Makes room for the docked panel on wide screens, so it never covers the page. */
export function PortalAssistantInset({ children }: { children: ReactNode }) {
	const { open } = useAssistant();
	return (
		<div
			className={cn(
				"transition-[padding] duration-300 ease-out",
				open && "lg:pr-(--assistant-panel-width)",
			)}
		>
			{children}
		</div>
	);
}

/** The floating help button and the chat that opens from it. */
export function PortalAssistant() {
	return (
		<>
			<PortalAssistantLauncher />
			<PortalAssistantPanel />
		</>
	);
}
