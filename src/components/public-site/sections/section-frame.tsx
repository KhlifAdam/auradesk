import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "../shared/reveal";

/** The look of the template a shared section is drawn in. */
export type SiteVariant = "minimal" | "editorial" | "bold";

const FRAME: Record<SiteVariant, string> = {
	minimal: "px-6 py-24 md:px-8 md:py-32",
	editorial: "px-6 py-24 md:px-12 md:py-32",
	bold: "px-4 py-24 md:px-8 md:py-32",
};

const HEADING: Record<SiteVariant, string> = {
	minimal: "items-center text-center",
	editorial:
		"site-border border-b pb-10 md:flex-row md:items-end md:justify-between",
	bold: "",
};

const TITLE: Record<SiteVariant, string> = {
	minimal: "text-4xl tracking-tight md:text-5xl",
	editorial: "text-5xl tracking-tight md:text-7xl",
	bold: "text-5xl font-bold uppercase leading-[0.9] tracking-tighter md:text-7xl",
};

const EYEBROW: Record<SiteVariant, string> = {
	minimal: "text-xs font-semibold uppercase tracking-[0.3em]",
	editorial: "text-xs uppercase tracking-[0.3em]",
	bold: "text-xs font-bold uppercase tracking-[0.35em]",
};

/** A shared section with a heading styled like the rest of its template. */
export function SectionFrame({
	id,
	variant,
	eyebrow,
	title,
	subtitle,
	children,
	className,
}: {
	id: string;
	variant: SiteVariant;
	eyebrow: string;
	title: string;
	subtitle?: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section id={id} className={cn(FRAME[variant], className)}>
			<div className="mx-auto flex max-w-7xl flex-col gap-14">
				<Reveal className={cn("flex flex-col gap-4", HEADING[variant])}>
					<div
						className={cn(
							"flex flex-col gap-3",
							variant === "minimal" && "items-center",
						)}
					>
						{variant !== "editorial" && (
							<span className={cn("site-accent-text", EYEBROW[variant])}>
								{eyebrow}
							</span>
						)}
						<h2 className={cn("site-heading", TITLE[variant])}>{title}</h2>
					</div>
					{subtitle && (
						<p className="site-muted max-w-md text-lg">{subtitle}</p>
					)}
				</Reveal>
				{children}
			</div>
		</section>
	);
}
