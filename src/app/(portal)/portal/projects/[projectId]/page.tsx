import { ArrowLeft, Clock, EyeOff, Images, MessageSquare } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { GalleryCard } from "@/components/client-work/gallery-card";
import { StageTimeline } from "@/components/client-work/stage-timeline";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { InvoiceSection } from "@/components/invoices/invoice-section";
import { ProjectOverview } from "@/components/portal/project/project-overview";
import { StudioHeading } from "@/components/portal/studio-heading";
import { Button } from "@/components/ui/button";
import { requireClient } from "@/lib/auth/require-client";
import { listClientProjectInvoices } from "@/services/invoices/queries";
import { getPortalProject } from "@/services/portal/queries";

export default async function PortalProjectPage({
	params,
	searchParams,
}: {
	params: Promise<{ projectId: string }>;
	searchParams: Promise<{ notice?: string }>;
}) {
	const t = await getTranslations("Portal.project");
	const { projectId } = await params;
	const { notice } = await searchParams;
	const { clientId } = await requireClient();
	const project = await getPortalProject(clientId, projectId);
	if (!project) notFound();
	const invoices = await listClientProjectInvoices(clientId, project.id);

	return (
		<>
			<Link
				href="/portal"
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("back")}
			</Link>
			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<StudioHeading
						studio={project.studio}
						fallbackName={project.photographerName}
					/>
					<Button
						asChild
						variant="outline"
						size="sm"
						className="h-8 gap-1.5 text-xs"
					>
						<Link href={`/portal/messages?studio=${project.photographerId}`}>
							<MessageSquare className="h-3.5 w-3.5" />
							{t("messageStudio")}
						</Link>
					</Button>
				</div>
				<h1 className="font-display text-2xl font-bold tracking-tight">
					{project.title}
				</h1>
			</div>
			<ProjectOverview project={project} />
			<section className="rounded-xl border border-border bg-card p-3">
				<h2 className="mb-2 text-xs font-medium text-muted-foreground">
					{t("progress")}
				</h2>
				<StageTimeline stage={project.stage} />
			</section>
			<InvoiceSection invoices={invoices} hrefBase="/portal/invoices" />
			<section className="flex flex-col gap-3">
				<h2 className="text-sm font-semibold">{t("galleries")}</h2>
				{notice === "galleryHidden" && (
					<p className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
						<EyeOff className="h-3.5 w-3.5 shrink-0" />
						{t("galleryHidden")}
					</p>
				)}
				{project.galleriesDeleteAt && project.galleries.length > 0 && (
					<p className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
						<Clock className="h-3.5 w-3.5 shrink-0" />
						{t("deleteNotice", { date: new Date(project.galleriesDeleteAt) })}
					</p>
				)}
				{project.galleries.length === 0 ? (
					<EmptyState
						icon={Images}
						title={t("noGalleries")}
						description={t("noGalleriesHint")}
					/>
				) : (
					<div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
						{project.galleries.map((gallery, index) => (
							<GalleryCard
								key={gallery.id}
								eager={index < 3}
								gallery={gallery}
								href={`/portal/galleries/${gallery.id}`}
							/>
						))}
					</div>
				)}
			</section>
		</>
	);
}
