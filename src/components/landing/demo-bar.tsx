import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE_TEMPLATES } from "@/services/studio/schemas";

/**
 * Floating bar over the demo site: says it's a sample, switches template and
 * leads to sign-up. It sits outside the site, so it keeps the app's look.
 */
export async function DemoBar({
	template,
}: {
	template: (typeof SITE_TEMPLATES)[number];
}) {
	const t = await getTranslations("Landing.demo");
	const tTemplates = await getTranslations("Site.appearance.template.options");

	return (
		<div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-3">
			<div className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-border bg-background/85 p-1.5 shadow-luminous backdrop-blur-xl">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="h-8 shrink-0 gap-1.5 rounded-full text-xs"
				>
					<Link href="/photographers" aria-label={t("back")}>
						<ArrowLeft className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">{t("label")}</span>
					</Link>
				</Button>
				<nav className="flex shrink-0 rounded-full bg-muted p-0.5">
					{SITE_TEMPLATES.map((id) => (
						<Link
							key={id}
							href={`/demo?template=${id}`}
							aria-current={id === template ? "page" : undefined}
							className={cn(
								"rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200",
								id === template
									? "bg-background text-foreground shadow"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{tTemplates(`${id}.name`)}
						</Link>
					))}
				</nav>
				<Button
					asChild
					size="sm"
					className="h-8 shrink-0 gap-1.5 rounded-full text-xs"
				>
					<Link href="/register">
						<span className="sm:hidden">{t("ctaShort")}</span>
						<span className="hidden sm:inline">{t("cta")}</span>
						<ArrowRight className="h-3.5 w-3.5" />
					</Link>
				</Button>
			</div>
		</div>
	);
}
