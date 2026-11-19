import { Bot, HardDrive, Plus, ScanEye, Users } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UsageSummary } from "@/services/billing/usage";

const ROWS = [
	{ key: "storage", icon: HardDrive },
	{ key: "assistant", icon: Bot },
	{ key: "photos", icon: ScanEye },
	{ key: "team", icon: Users },
] as const;

/** How much of the plan the studio uses: storage, AI quotas and team seats. */
export async function UsageCard({ usage }: { usage: UsageSummary }) {
	const t = await getTranslations("Billing.usage");
	const format = await getFormatter();

	const bytes = (value: number) =>
		value >= 1e12
			? `${format.number(value / 1e12, { maximumFractionDigits: 1 })} ${t("tb")}`
			: `${format.number(value / 1e9, { maximumFractionDigits: 1 })} ${t("gb")}`;

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div className="flex flex-col gap-0.5">
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				<p className="text-xs text-muted-foreground">{t("resets")}</p>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				{ROWS.map(({ key, icon: Icon }) => {
					const { used, limit } = usage[key];
					const share = limit > 0 ? Math.min(100, (used / limit) * 100) : 100;
					const full = used >= limit;
					const show = key === "storage" ? bytes : format.number;
					return (
						<div key={key} className="flex flex-col gap-1.5">
							<div className="flex items-center justify-between gap-2 text-xs">
								<span className="flex items-center gap-1.5 font-medium">
									<Icon className="h-3.5 w-3.5 text-muted-foreground" />
									{t(key)}
									{key === "storage" && (
										<Link
											href="/dashboard/subscription?change=1#plan"
											className="inline-flex items-center gap-0.5 text-[11px] font-normal text-primary hover:underline"
										>
											<Plus className="h-3 w-3" />
											{t("add")}
										</Link>
									)}
								</span>
								<span
									className={cn(
										"text-muted-foreground",
										full && "font-medium text-destructive",
									)}
								>
									{full
										? t("full")
										: t("of", { used: show(used), limit: show(limit) })}
								</span>
							</div>
							<Progress
								value={share}
								className={cn("h-1.5", full && "bg-destructive/20")}
							/>
						</div>
					);
				})}
			</div>
		</section>
	);
}
