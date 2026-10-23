import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/landing/legal-page";
import { BRAND_NAME } from "@/lib/brand";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Legal.terms");
	return { title: `${t("title")} | ${BRAND_NAME}` };
}

export default function TermsPage() {
	return <LegalPage document="terms" />;
}
