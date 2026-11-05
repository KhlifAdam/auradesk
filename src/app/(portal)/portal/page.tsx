import { FolderOpen, Link2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { type CSSProperties, Suspense } from "react";
import { LinkCard } from "@/components/account/link-card";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { NewRequestDialog } from "@/components/portal/home/new-request-dialog";
import { PortalDashboard } from "@/components/portal/home/portal-dashboard";
import { NameCard } from "@/components/portal/name-card";
import { PendingInvitations } from "@/components/portal/pending-invitations";
import { PortalProjectCard } from "@/components/portal/portal-project-card";
import { PortalProjectsSkeleton } from "@/components/portal/portal-skeletons";
import { StudioHeading } from "@/components/portal/studio-heading";
import { requireClient } from "@/lib/auth/require-client";
import { isPhoneEmail } from "@/lib/phone";
import {
	getPortalHome,
	listClientStudios,
} from "@/services/portal/home-queries";
import { listPortalProjects } from "@/services/portal/queries";
import type { PortalProject } from "@/services/portal/types";
import { pageParamsSchema } from "@/services/shared/pagination";

interface PortalPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PortalPage({ searchParams }: PortalPageProps) {
	const t = await getTranslations("Portal.projects");
	const { page } = pageParamsSchema.parse(await searchParams);
	const { session } = await requireClient();
	const studios = await listClientStudios(session.user);

	return (
		<>
			<div className="space-rise flex flex-wrap items-end justify-between gap-4">
				<div className="flex flex-col gap-1.5">
					<h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
						{t.rich("greeting", {
							name: session.user.name.split(" ")[0],
							accent: (chunks) => (
								<span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
									{chunks}
								</span>
							),
						})}
					</h1>
					<p className="text-sm text-muted-foreground md:text-base">
						{t("description")}
					</p>
				</div>
				{studios.length > 0 && <NewRequestDialog studios={studios} />}
			</div>
			<div
				className="space-rise"
				style={{ "--reveal-delay": "90ms" } as CSSProperties}
			>
				<Suspense
					fallback={
						<div className="h-36 animate-pulse rounded-2xl bg-muted/60" />
					}
				>
					<Home />
				</Suspense>
			</div>
			{session.user.phoneNumber &&
				session.user.name === session.user.phoneNumber && <NameCard />}
			{/* Signed in by phone: their projects may sit on an email account. */}
			{isPhoneEmail(session.user.email) && (
				<LinkCard
					href="/portal/account#link-account"
					icon={Link2}
					title={t("linkPrompt.title")}
					description={t("linkPrompt.description")}
				/>
			)}
			<Suspense>
				<PendingInvitations />
			</Suspense>
			<Suspense key={page} fallback={<PortalProjectsSkeleton />}>
				<ProjectGroups page={page} />
			</Suspense>
		</>
	);
}

/** Groups one page of projects by photographer, keeping the page's order. */
function groupByStudio(projects: PortalProject[]) {
	const groups = new Map<string, PortalProject[]>();
	for (const project of projects) {
		const key = project.studio?.slug ?? project.photographerName;
		groups.set(key, [...(groups.get(key) ?? []), project]);
	}
	return [...groups.values()];
}

async function ProjectGroups({ page }: { page: number }) {
	const t = await getTranslations("Portal.projects");
	const { clientId } = await requireClient();
	const projects = await listPortalProjects(clientId, page);

	if (projects.total === 0) {
		return (
			<EmptyState
				icon={FolderOpen}
				title={t("empty.title")}
				description={t("empty.description")}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-8">
			{groupByStudio(projects.items).map((group, index) => (
				<section
					key={group[0].id}
					className="space-rise flex flex-col gap-3"
					style={{ "--reveal-delay": `${180 + index * 90}ms` } as CSSProperties}
				>
					<StudioHeading
						studio={group[0].studio}
						fallbackName={group[0].photographerName}
					/>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{group.map((project) => (
							<PortalProjectCard key={project.id} project={project} />
						))}
					</div>
				</section>
			))}
			<UrlPagination page={projects.page} pageCount={projects.pageCount} />
		</div>
	);
}

async function Home() {
	const { session } = await requireClient();
	return <PortalDashboard home={await getPortalHome(session.user)} />;
}
