import { CalendarDays, Images, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { StageBadge } from "@/components/client-work/stage-badge";
import {
	CARD,
	CARD_GRID,
	CARD_MEDIA,
} from "@/components/dashboard/shared/card-grid";
import { SERVICE_ICONS } from "@/components/dashboard/shared/service-icon";
import {
	ChangePill,
	changeRowHighlight,
} from "@/components/shared/change-mark";
import { cn } from "@/lib/utils";
import type { ProjectCover } from "@/services/projects/covers";
import { formatMoney } from "@/services/projects/money";
import type { ProjectSummary } from "@/services/projects/types";
import { PaymentBadge } from "./payment-badge";

/** Project cards: a photo from its galleries (or its kind of shoot), then the essentials. */
export async function ProjectCards({
	projects,
	covers,
}: {
	projects: ProjectSummary[];
	/** Album covers by project id. */
	covers: Record<string, ProjectCover>;
}) {
	const t = await getTranslations("Projects.list");
	const format = await getFormatter();
	const locale = await getLocale();

	return (
		<ul className={CARD_GRID}>
			{projects.map((project) => {
				const Icon = SERVICE_ICONS[project.serviceType];
				const cover = covers[project.id];
				return (
					<li key={project.id}>
						<Link
							href={`/dashboard/projects/${project.id}`}
							className={cn(CARD, "h-full", changeRowHighlight(project.mark))}
						>
							<div className={CARD_MEDIA}>
								{cover ? (
									// Signed private URLs: served as they are.
									<Image
										src={cover.url}
										alt=""
										fill
										unoptimized
										sizes="(min-width: 1280px) 20vw, 33vw"
										className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
										// Framed like the album cover.
										style={{
											objectPosition: `${cover.focalX * 100}% ${cover.focalY * 100}%`,
										}}
									/>
								) : (
									<Icon className="h-6 w-6 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
								)}
								<span className="absolute right-1.5 top-1.5">
									<ChangePill mark={project.mark} />
								</span>
							</div>
							<div className="flex flex-1 flex-col gap-1.5 p-2.5">
								<div className="flex items-start justify-between gap-2">
									<span className="truncate text-sm font-medium">
										{project.title}
									</span>
									{project.price !== null && (
										<span className="shrink-0 text-sm font-semibold text-primary">
											{formatMoney(project.price, locale)}
										</span>
									)}
								</div>
								<div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
									<span className="flex min-w-0 items-center gap-1">
										<User className="h-3 w-3 shrink-0" />
										<span className="truncate">
											{project.client.name ??
												project.client.email ??
												t("noClient")}
										</span>
									</span>
									<span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
										{project.eventDate && (
											<span className="flex items-center gap-1">
												<CalendarDays className="h-3 w-3" />
												{format.dateTime(new Date(project.eventDate), {
													dateStyle: "medium",
													timeZone: "UTC",
												})}
											</span>
										)}
										<span className="flex items-center gap-1">
											<Images className="h-3 w-3" />
											{t("galleries", { count: project.galleryCount })}
										</span>
									</span>
								</div>
								<div className="mt-auto flex flex-wrap items-center gap-1">
									<StageBadge stage={project.stage} />
									<PaymentBadge status={project.paymentStatus} />
								</div>
							</div>
						</Link>
					</li>
				);
			})}
		</ul>
	);
}
