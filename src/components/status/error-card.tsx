"use client";

import { ArrowLeft, RotateCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useTransition } from "react";
import { cn } from "@/lib/utils";

interface ErrorCardProps {
	error: Error & { digest?: string };
	retry: () => void;
	/** Where "Go back" leads: the home of the space the error happened in. */
	href: string;
	/** "page" fills the screen; "inline" sits inside a dashboard layout. */
	variant?: "page" | "inline";
}

/** Shared screen for unexpected errors, with a retry and a way out. */
export function ErrorCard({
	error,
	retry,
	href,
	variant = "page",
}: ErrorCardProps) {
	const t = useTranslations("ErrorPage");
	const [pending, startTransition] = useTransition();

	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main
			className={cn(
				"relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center text-foreground",
				variant === "page" ? "min-h-dvh bg-background py-20" : "py-16",
			)}
		>
			{variant === "page" && (
				<div className="pointer-events-none absolute inset-0 mesh-glow opacity-60" />
			)}
			<div className="relative flex max-w-md flex-col items-center gap-5">
				<div className="relative">
					<div className="absolute inset-0 rounded-full bg-destructive/25 blur-2xl" />
					<div className="relative grid size-14 place-items-center rounded-2xl border border-border bg-card shadow-luminous">
						<TriangleAlert className="size-6 text-destructive" />
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<h1 className="font-display text-2xl font-semibold tracking-tight">
						{t("title")}
					</h1>
					<p className="text-balance text-sm leading-6 text-muted-foreground">
						{t("description")}
					</p>
				</div>

				<div className="flex flex-wrap items-center justify-center gap-2">
					<button
						type="button"
						disabled={pending}
						onClick={() => startTransition(() => retry())}
						className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-luminous transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
					>
						<RotateCw className={cn("size-4", pending && "animate-spin")} />
						{t("retry")}
					</button>
					<Link
						href={href}
						className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition-colors duration-300 hover:bg-muted"
					>
						<ArrowLeft className="size-4" />
						{t("back")}
					</Link>
				</div>

				{error.digest && (
					<p className="text-[11px] text-muted-foreground/70">
						{t("reference", { digest: error.digest })}
					</p>
				)}
			</div>
		</main>
	);
}
