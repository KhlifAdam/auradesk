import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Overview } from "@/services/overview/queries";

/** Onboarding steps, derived from what the photographer already has. */
function getSteps({ studio, counts }: Overview) {
	return [
		{ id: "studio", done: studio !== null, href: "/dashboard/site" },
		{ id: "media", done: counts.media > 0, href: "/dashboard/portfolio/files" },
		{ id: "album", done: counts.albums > 0, href: "/dashboard/portfolio" },
		{ id: "package", done: counts.packages > 0, href: "/dashboard/services" },
		{
			id: "publish",
			done: studio?.published === true,
			href: "/dashboard/site",
		},
	] as const;
}

export function SetupChecklist({ overview }: { overview: Overview }) {
	const t = useTranslations("Dashboard.Overview.checklist");
	const steps = getSteps(overview);
	const done = steps.filter((step) => step.done).length;
	const isComplete = done === steps.length;

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<header className="flex items-center justify-between gap-2">
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				<span className="text-xs text-muted-foreground">
					{t("progress", { done, total: steps.length })}
				</span>
			</header>
			<div className="h-1 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-primary transition-all duration-500"
					style={{ width: `${(done / steps.length) * 100}%` }}
				/>
			</div>
			{isComplete ? (
				<p className="text-xs text-muted-foreground">{t("complete")}</p>
			) : (
				<ul className="flex flex-col">
					{steps.map(({ id, done: isDone, href }) => (
						<li key={id}>
							<Link
								href={href}
								className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-muted"
							>
								<span
									className={cn(
										"flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
										isDone
											? "border-primary bg-primary text-primary-foreground"
											: "border-border",
									)}
								>
									{isDone && <Check className="h-2.5 w-2.5" />}
								</span>
								<span
									className={cn(
										"flex-1",
										isDone && "text-muted-foreground line-through",
									)}
								>
									{t(id)}
								</span>
								{!isDone && (
									<ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
								)}
							</Link>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
