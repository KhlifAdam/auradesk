import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { BRAND_NAME } from "@/lib/brand";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Auth.adminLogin");
	return {
		title: `${t("title")} | ${BRAND_NAME}`,
		// Not for search engines: this page is for the platform's own staff.
		robots: { index: false, follow: false },
	};
}

export default function AdminLoginPage() {
	return <AdminLoginForm />;
}
