import { Bell } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getLatestClientBook } from "@/services/books/queries";
import type { PortalProject } from "@/services/portal/types";

/**
 * What the studio changed since the client last opened the project, shown
 * once: opening the project marks it seen.
 */
export async function ProjectUpdateBanner({
	project,
	studio,
	clientId,
}: {
	project: PortalProject;
	studio: string;
	clientId: string;
}) {
	if (!project.update) return null;
	const t = await getTranslations("Portal.updates.banner");
	const tStages = await getTranslations("Projects.stages");
	const tBook = await getTranslations("PhotoBook.status");
	// A photo book step names the book and where it is now.
	const book =
		project.update === "book"
			? await getLatestClientBook(clientId, project.id)
			: null;

	return (
		<p className="flex flex-wrap items-start gap-x-2.5 gap-y-1 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
			<Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
			<span className="min-w-0 flex-1">
				{book
					? t("book", {
							title: book.title,
							status: book.awaitingApprovalAt
								? tBook("awaitingApproval")
								: tBook(book.status),
						})
					: t(project.update, { studio, stage: tStages(project.stage) })}
			</span>
			{book && (
				<Link
					href={`/portal/books/${book.id}`}
					className="text-xs font-medium text-primary underline-offset-2 hover:underline"
				>
					{t("openBook")}
				</Link>
			)}
		</p>
	);
}
