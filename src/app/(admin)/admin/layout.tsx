import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { SpaceHeader } from "@/components/shared/space-header";
import { requireAdmin } from "@/lib/auth/require-admin";
import { BRAND_NAME } from "@/lib/brand";
import { realEmail } from "@/lib/phone";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Admin");
	return { title: `${t("title")} | ${BRAND_NAME}` };
}

export default async function AdminLayout({
	children,
}: {
	children: ReactNode;
}) {
	const t = await getTranslations("Admin");
	const { session } = await requireAdmin();

	return (
		<div className="min-h-screen bg-background">
			<SpaceHeader
				title={t("title")}
				home="/admin"
				icon={<ShieldCheck className="h-4 w-4" />}
				user={{
					name: session.user.name,
					email: realEmail(session.user.email) ?? "",
					image: session.user.image,
				}}
				isPhotographer={false}
			/>
			<main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
				<AdminNav />
				{children}
			</main>
		</div>
	);
}
