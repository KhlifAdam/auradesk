"use client";

import "./globals.css";

import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";
import { ErrorCard } from "@/components/status/error-card";

type Locale = "en" | "fr";

/**
 * Replaces the root layout when it fails, so no provider is mounted here.
 * The messages are fetched only now, to keep them out of every page's bundle.
 */
export default function GlobalError({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	const [intl, setIntl] = useState<{
		locale: Locale;
		messages: AbstractIntlMessages;
	} | null>(null);

	useEffect(() => {
		const locale: Locale = navigator.language.toLowerCase().startsWith("fr")
			? "fr"
			: "en";
		const load =
			locale === "fr"
				? import("../../messages/fr.json")
				: import("../../messages/en.json");
		load.then((mod) =>
			setIntl({ locale, messages: { ErrorPage: mod.default.ErrorPage } }),
		);
	}, []);

	return (
		<html lang={intl?.locale ?? "en"} className="dark">
			<body className="min-h-dvh bg-background font-sans antialiased">
				{intl && (
					<NextIntlClientProvider locale={intl.locale} messages={intl.messages}>
						<ErrorCard error={error} retry={retry} href="/" />
					</NextIntlClientProvider>
				)}
			</body>
		</html>
	);
}
