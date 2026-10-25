"use client";

import { AlertTriangle, ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { SaveStatus } from "./use-book-design";

interface BookHeaderProps {
	projectId: string;
	projectTitle: string;
	title: string;
	status: SaveStatus;
	/** Photos too small to print sharp at this book size. */
	lowResolution: number;
	/** The main button: sending the book to the studio. */
	action: ReactNode;
}

/** The editor's top: where you are, whether it's saved, the order button, and print-quality warnings. */
export function BookHeader({
	projectId,
	projectTitle,
	title,
	status,
	lowResolution,
	action,
}: BookHeaderProps) {
	const t = useTranslations("PhotoBook.editor");

	return (
		<>
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-1">
					<Link
						href={`/portal/projects/${projectId}`}
						className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						{projectTitle}
					</Link>
					<h1 className="truncate font-display text-2xl font-bold tracking-tight">
						{title || t("untitled")}
					</h1>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<span
						className="flex items-center gap-1.5 text-xs text-muted-foreground"
						aria-live="polite"
					>
						{status === "saving" && (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						)}
						{status === "saved" && (
							<Check className="h-3.5 w-3.5 text-success" />
						)}
						{status === "error" && (
							<AlertTriangle className="h-3.5 w-3.5 text-destructive" />
						)}
						{t(`status.${status}`)}
					</span>
					{action}
				</div>
			</header>

			{lowResolution > 0 && (
				<p className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
					<AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
					{t("lowResolutionWarning", { count: lowResolution })}
				</p>
			)}
		</>
	);
}
