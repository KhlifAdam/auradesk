import { notFound } from "next/navigation";
import { getThread, listThreads } from "@/services/assistant/queries";
import { pageParamsSchema } from "@/services/shared/pagination";
import { AssistantWorkspace } from "./assistant-workspace";

interface AssistantPageProps {
	userId: string;
	team: boolean;
	basePath: string;
	threadId: string | null;
	searchParams: Record<string, string | string[] | undefined>;
}

/** The full-page assistant: the user's threads beside one conversation. */
export async function AssistantPage({
	userId,
	team,
	basePath,
	threadId,
	searchParams,
}: AssistantPageProps) {
	const { page } = pageParamsSchema.parse(searchParams);
	const [threads, thread] = await Promise.all([
		listThreads(userId, page),
		threadId ? getThread(userId, threadId) : null,
	]);
	if (threadId && !thread) notFound();

	return (
		<AssistantWorkspace
			key={threadId ?? "new"}
			threads={threads}
			thread={thread && { id: thread.id, messages: thread.messages }}
			team={team}
			basePath={basePath}
		/>
	);
}
