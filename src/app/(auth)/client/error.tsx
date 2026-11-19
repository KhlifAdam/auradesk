"use client";

import { ErrorCard } from "@/components/status/error-card";
import { AUTH_PATHS } from "@/lib/auth/client-intent";

/** Caught here so the error keeps the client's colour (see client/layout.tsx). */
export default function ClientAuthErrorPage({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	return (
		<div data-space="client" className="contents">
			<ErrorCard error={error} retry={retry} href={AUTH_PATHS.client.welcome} />
		</div>
	);
}
