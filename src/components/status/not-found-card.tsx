import { Aperture, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

/**
 * Shared "not found" screen for the landing site and public studio sites.
 * `namespace` points at the messages (`NotFound.page`, `.studio`, `.shareLink`).
 */
export async function NotFoundCard({
	namespace,
	href,
	className,
}: {
	namespace: "NotFound.page" | "NotFound.studio" | "NotFound.shareLink";
	href: string;
	className?: string;
}) {
	const t = await getTranslations(namespace);
	const tCommon = await getTranslations("NotFound");

	return (
		<main
			className={cn(
				"relative flex min-h-dvh flex-1 flex-col items-center justify-center overflow-hidden bg-background px-6 py-20 text-center text-foreground",
				className,
			)}
		>
			<div className="pointer-events-none absolute inset-0 mesh-glow opacity-70" />
			<div className="pointer-events-none absolute inset-0 grid-fade opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

			<div className="relative flex max-w-md flex-col items-center gap-6">
				<div className="relative">
					<div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl" />
					<div className="relative grid size-16 place-items-center rounded-2xl border border-border bg-card shadow-luminous">
						<Aperture className="size-7 text-primary" />
					</div>
				</div>

				<p className="font-display text-7xl font-semibold tracking-tight text-muted-foreground/40">
					{tCommon("code")}
				</p>

				<div className="flex flex-col gap-3">
					<h1 className="font-display text-3xl font-semibold tracking-tight">
						{t("title")}
					</h1>
					<p className="text-balance text-sm leading-6 text-muted-foreground">
						{t("description")}
					</p>
				</div>

				<Link
					href={href}
					className="group inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-luminous transition-transform hover:-translate-y-0.5"
				>
					{t("action")}
					<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
				</Link>
			</div>
		</main>
	);
}
