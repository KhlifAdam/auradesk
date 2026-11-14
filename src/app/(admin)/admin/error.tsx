"use client";

import { ErrorCard } from "@/components/status/error-card";

export default function ErrorPage({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	return (
		<ErrorCard error={error} retry={retry} href="/admin" variant="inline" />
	);
}
