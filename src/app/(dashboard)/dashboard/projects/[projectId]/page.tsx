import {
	ArrowLeft,
	ArrowUpRight,
	CheckCircle2,
	Eye,
	EyeOff,
	Images,
	Pencil,
	Upload,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { GalleryCard } from "@/components/client-work/gallery-card";
import { ProjectEquipmentSection } from "@/components/dashboard/equipment/project-equipment-section";
import { NewGalleryDialog } from "@/components/dashboard/projects/new-gallery-dialog";
import { ProjectClientCard } from "@/components/dashboard/projects/project-client-card";
import { ProjectDeleteButton } from "@/components/dashboard/projects/project-delete-button";
import { ProjectFacts } from "@/components/dashboard/projects/project-facts";
import { ProjectStageControl } from "@/components/dashboard/projects/project-stage-control";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { ProjectTeamSection } from "@/components/dashboard/team/project-team-section";
import { InvoiceSection } from "@/components/invoices/invoice-section";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { listProjectEquipment } from "@/services/equipment/queries";
import { listProjectInvoices } from "@/services/invoices/queries";
import {
	advanceShootDays,
	isAutoAdvanceOn,
} from "@/services/projects/auto-stage";
import { getProject } from "@/services/projects/queries";
import {
	canClientView,
	isDeliveredToClient,
} from "@/services/projects/visibility";
import { listProjectTeam } from "@/services/team/queries";

export default async function ProjectPage({
	params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	const t = await getTranslations("Projects.detail");
	const { projectId } = await params;
	const { photographerId } = await requirePhotographer();
	await advanceShootDays(photographerId);
	const project = await getProject(photographerId, projectId);
	if (!project) notFound();
	const [invoices, gear, crew, autoAdvance] = await Promise.all([
		listProjectInvoices(photographerId, project.id),
		listProjectEquipment(photographerId, project.id),
		listProjectTeam(photographerId, project.id),
		isAutoAdvanceOn(photographerId),
	]);

	return (
		<PageShell>
			<Link
				href="/dashboard/projects"
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("back")}
			</Link>
			<PageHeader
				title={project.title}
				actions={
					<>
						<ProjectDeleteButton projectId={project.id} />
						<Button
							asChild
							size="sm"
							variant="outline"
							className="h-7 gap-1.5 text-xs"
						>
							<Link href={`/dashboard/projects/${project.id}/edit`}>
								<Pencil className="h-3.5 w-3.5" />
								{t("edit")}
							</Link>
						</Button>
					</>
				}
			/>
			{project.bookingId && (
				<Link
					href={`/dashboard/bookings/${project.bookingId}`}
					className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					{t("fromBooking")}
					<ArrowUpRight className="h-3 w-3" />
				</Link>
			)}
			<ProjectClientCard projectId={project.id} client={project.client} />
			<ProjectFacts project={project} />
			<ProjectStageControl
				projectId={project.id}
				stage={project.stage}
				payment={project.paymentStatus}
				autoAdvance={autoAdvance}
			/>
			<ProjectTeamSection projectId={project.id} assignments={crew} />
			<ProjectEquipmentSection
				projectId={project.id}
				eventDate={project.eventDate}
				bookings={gear}
			/>
			<InvoiceSection
				invoices={invoices}
				hrefBase="/dashboard/invoices"
				newHref={`/dashboard/invoices/new?project=${project.id}`}
			/>
			<section className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold">{t("galleries")}</h2>
					<div className="flex items-center gap-2">
						<Button asChild size="sm" className="h-7 gap-1.5 text-xs">
							<Link href={`/dashboard/projects/${project.id}/import`}>
								<Upload className="h-3.5 w-3.5" />
								{t("importFiles")}
							</Link>
						</Button>
						<NewGalleryDialog projectId={project.id} />
					</div>
				</div>
				<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
					{isDeliveredToClient(project) ? (
						<>
							<CheckCircle2 className="h-3.5 w-3.5 text-success" />
							{t("filesDelivered")}
						</>
					) : canClientView(project) ? (
						<>
							<Eye className="h-3.5 w-3.5" />
							{t("filesProofing")}
						</>
					) : (
						<>
							<EyeOff className="h-3.5 w-3.5" />
							{t("filesHidden")}
						</>
					)}
				</p>
				{project.galleries.length === 0 ? (
					<EmptyState
						icon={Images}
						title={t("noGalleries")}
						description={t("noGalleriesHint")}
					/>
				) : (
					<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
						{project.galleries.map((gallery, index) => (
							<GalleryCard
								key={gallery.id}
								eager={index < 3}
								gallery={gallery}
								href={`/dashboard/projects/${project.id}/galleries/${gallery.id}`}
								showShareState
							/>
						))}
					</div>
				)}
			</section>
		</PageShell>
	);
}
