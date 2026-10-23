import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ImportStageHint } from "@/components/dashboard/projects/import/import-stage-hint";
import { ProjectImporter } from "@/components/dashboard/projects/import/project-importer";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { listInterruptedUploads } from "@/services/galleries/upload-queries";
import { isAutoAdvanceOn } from "@/services/projects/auto-stage";
import { getProject } from "@/services/projects/queries";
import { stageIndex } from "@/services/projects/stages";

interface ImportPageProps {
	params: Promise<{ projectId: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The project's Import step: bring the shoot's photos and videos in. */
export default async function ImportPage({
	params,
	searchParams,
}: ImportPageProps) {
	const t = await getTranslations("Projects.import");
	const { projectId } = await params;
	const { gallery } = await searchParams;
	const { photographerId } = await requirePhotographer();
	const [project, interrupted, autoAdvance] = await Promise.all([
		getProject(photographerId, projectId),
		listInterruptedUploads(photographerId, projectId),
		isAutoAdvanceOn(photographerId),
	]);
	if (!project) notFound();

	const galleries = project.galleries.map(({ id, title, kind, itemCount }) => ({
		id,
		title,
		kind,
		itemCount,
	}));
	// The gallery in the URL if it is one of this project's, else the first.
	const galleryId =
		galleries.find((g) => g.id === gallery)?.id ?? galleries[0]?.id ?? null;

	return (
		<PageShell>
			<Link
				href={`/dashboard/projects/${project.id}`}
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("back")}
			</Link>
			<PageHeader title={t("title")} description={project.title} />
			{stageIndex(project.stage) < stageIndex("IMPORT") && (
				<ImportStageHint projectId={project.id} auto={autoAdvance} />
			)}
			<ProjectImporter
				projectId={project.id}
				galleries={galleries}
				galleryId={galleryId}
				interrupted={interrupted}
			/>
		</PageShell>
	);
}
