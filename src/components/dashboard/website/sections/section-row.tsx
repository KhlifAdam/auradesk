"use client";

import {
	ArrowUpRight,
	BarChart3,
	Briefcase,
	ChevronDown,
	CircleHelp,
	Clapperboard,
	Handshake,
	Images,
	type LucideIcon,
	Mail,
	MessageSquareQuote,
	UserRound,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
	BUILT_IN_KINDS,
	type SectionKind,
	type SectionsValues,
} from "@/services/site-sections/schemas";
import { SectionContent } from "./section-content";

const ICONS: Record<SectionKind, LucideIcon> = {
	portfolio: Images,
	clients: Handshake,
	services: Briefcase,
	stats: BarChart3,
	testimonials: MessageSquareQuote,
	showreel: Clapperboard,
	about: UserRound,
	faq: CircleHelp,
	contact: Mail,
};

/** Where the content of the sections built from other pages is edited. */
const MANAGED_AT: Partial<Record<SectionKind, string>> = {
	portfolio: "/dashboard/portfolio",
	services: "/dashboard/services",
	about: "/dashboard/site",
	contact: "/dashboard/site",
};

const isBuiltIn = (kind: SectionKind) =>
	(BUILT_IN_KINDS as readonly string[]).includes(kind);

/** One section: drag grip, name, on/off switch, and its content when opened. */
export function SectionRow({
	index,
	kind,
	handle,
}: {
	index: number;
	kind: SectionKind;
	handle: ReactNode;
}) {
	const t = useTranslations("Site.sections");
	const { control, setValue } = useFormContext<SectionsValues>();
	const enabled = useWatch({ control, name: `sections.${index}.enabled` });
	const { errors } = useFormState({ control, name: `sections.${index}` });
	const [opened, setOpen] = useState(false);
	// A section with invalid fields opens, so its errors are seen.
	const open = opened || Boolean(errors.sections?.[index]);
	const Icon = ICONS[kind];
	const managedAt = MANAGED_AT[kind];
	// The portfolio opens too: it picks which albums the site shows.
	const editable = !isBuiltIn(kind) || kind === "portfolio";

	return (
		<div
			className={cn(
				"rounded-xl border border-border bg-card transition-opacity duration-300",
				!enabled && "opacity-60",
			)}
		>
			<div className="flex items-center gap-2 px-2 py-2">
				{handle}
				<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Icon className="h-4 w-4" />
				</span>
				<button
					type="button"
					disabled={!editable}
					onClick={() => setOpen((value) => !value)}
					className="flex min-w-0 flex-1 flex-col items-start text-left disabled:cursor-default"
				>
					<span className="text-sm font-medium">{t(`kinds.${kind}.name`)}</span>
					<span className="truncate text-xs text-muted-foreground">
						{t(`kinds.${kind}.hint`)}
					</span>
				</button>
				{managedAt && (
					<Link
						href={managedAt}
						className="hidden items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
					>
						{t("editContent")}
						<ArrowUpRight className="h-3 w-3" />
					</Link>
				)}
				<Switch
					checked={enabled}
					onCheckedChange={(value) =>
						setValue(`sections.${index}.enabled`, value, { shouldDirty: true })
					}
					aria-label={t("show")}
				/>
				{editable && (
					<button
						type="button"
						onClick={() => setOpen((value) => !value)}
						aria-label={t("edit")}
						aria-expanded={open}
						className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<ChevronDown
							className={cn(
								"h-4 w-4 transition-transform duration-300",
								open && "rotate-180",
							)}
						/>
					</button>
				)}
			</div>
			{/* Kept mounted when closed, so unsaved edits and errors stay. */}
			{editable && (
				<div className={cn("border-t border-border p-4", !open && "hidden")}>
					<SectionContent index={index} kind={kind} />
				</div>
			)}
		</div>
	);
}
