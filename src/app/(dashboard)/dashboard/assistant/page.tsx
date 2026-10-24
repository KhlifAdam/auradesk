import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AssistantPage } from "@/components/assistant/page/assistant-page";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { BRAND_NAME } from "@/lib/brand";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Assistant.page");
	return { title: `${t("title")} | ${BRAND_NAME}` };
}

export default async function AssistantNewPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const { session } = await requirePhotographer();
	return (
		<AssistantPage
			userId={session.user.id}
			team={false}
			basePath="/dashboard/assistant"
			threadId={null}
			searchParams={await searchParams}
		/>
	);
}
