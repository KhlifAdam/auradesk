import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { BRAND_NAME } from "@/lib/brand";
import { env } from "@/lib/env";
import "./globals.css";

const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
	variable: "--font-manrope",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Metadata");
	const title = t("title");
	const description = t("description");
	return {
		// Lets pages give relative URLs (canonical, Open Graph) that resolve
		// against the app's public address.
		metadataBase: new URL(env.BETTER_AUTH_URL),
		title,
		description,
		openGraph: { type: "website", siteName: BRAND_NAME, title, description },
		twitter: { card: "summary", title, description },
	};
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const locale = await getLocale();

	return (
		<html
			lang={locale}
			className={`${dmSans.variable} ${manrope.variable} h-full antialiased`}
			suppressHydrationWarning
		>
			<body className="min-h-full flex flex-col">
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem
					disableTransitionOnChange
				>
					<NextIntlClientProvider>
						{children}
						<Toaster richColors closeButton />
					</NextIntlClientProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
