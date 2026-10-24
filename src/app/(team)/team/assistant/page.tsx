import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AssistantPage } from "@/components/assistant/page/assistant-page";
import { requireTeamUser } from "@/lib/auth/require-team-user";
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
	const { session } = await requireTeamUser();
	return (
		<AssistantPage
			userId={session.user.id}
			team
			basePath="/team/assistant"
			threadId={null}
			searchParams={await searchParams}
		/>
	);
}
