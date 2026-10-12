import {
	AlertTriangle,
	CheckCircle2,
	ChevronRight,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { cn } from "@/lib/utils";
import { getAssistantReminders } from "@/services/ai/reminders";

/** What the studio assistant suggests doing now, most urgent first. */
export async function AssistantCard() {
	const t = await getTranslations("Ai.reminders");
	const { photographerId } = await requirePhotographer();
	const reminders = await getAssistantReminders(photographerId);

	return (
		<section className="flex flex-col gap-2 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-3">
			<div className="flex items-center gap-2">
				<Sparkles className="h-4 w-4 text-primary" />
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				{reminders.length > 0 && (
					<span className="rounded-full bg-primary/15 px-1.5 text-[11px] font-medium text-primary">
						{reminders.length}
					</span>
				)}
			</div>
			{reminders.length === 0 ? (
				<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<CheckCircle2 className="h-3.5 w-3.5 text-success" />
					{t("allClear")}
				</p>
			) : (
				<ul className="flex flex-col divide-y divide-border/60">
					{reminders.map((reminder) => (
						<li key={`${reminder.kind}-${reminder.href}`}>
							<Link
								href={reminder.href}
								className="group flex items-center gap-2 py-1.5 text-sm"
							>
								<AlertTriangle
									className={cn(
										"h-3.5 w-3.5 shrink-0",
										reminder.urgent ? "text-destructive" : "text-primary",
									)}
								/>
								<span className="min-w-0 flex-1">
									{t(reminder.kind, reminder.values)}
								</span>
								<ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
							</Link>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

export function AssistantCardSkeleton() {
	return (
		<div className="h-28 animate-pulse rounded-xl border border-border bg-muted/50" />
	);
}
