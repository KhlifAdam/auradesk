import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProjectForm } from "@/components/dashboard/projects/form/project-form";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { projectToValues } from "@/services/projects/form-values";
import { getProject } from "@/services/projects/queries";

export default async function EditProjectPage({
	params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	const t = await getTranslations("Projects.form");
	const { projectId } = await params;
	const { photographerId } = await requirePhotographer();
	const project = await getProject(photographerId, projectId);
	if (!project) notFound();

	return (
		<PageShell>
			<Link
				href={`/dashboard/projects/${project.id}`}
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("backToProject")}
			</Link>
			<PageHeader title={t("editTitle")} description={project.title} />
			<ProjectForm
				projectId={project.id}
				discount={project.discount}
				initial={{
					...projectToValues(project),
					clientEmail: "",
					invitePhone: false,
				}}
			/>
		</PageShell>
	);
}
