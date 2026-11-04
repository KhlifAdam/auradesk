import type { ReactNode } from "react";

/** Re-runs on every navigation: each page of the client space fades in. */
export default function PortalTemplate({ children }: { children: ReactNode }) {
	return <div className="space-fade flex flex-col gap-6">{children}</div>;
}
