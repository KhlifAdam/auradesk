import { Ban, History, RotateCcw, ShieldMinus, ShieldPlus } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import type { listAdminActions } from "@/services/admin/audit";

const ICONS = {
	BAN: Ban,
	UNBAN: RotateCcw,
	GRANT_ADMIN: ShieldPlus,
	REVOKE_ADMIN: ShieldMinus,
} as const;

type AuditPage = Awaited<ReturnType<typeof listAdminActions>>;

/** The admin activity log: who did what to whom, when and why. */
export async function AuditList({ log }: { log: AuditPage }) {
	const t = await getTranslations("Admin.activity");
	const format = await getFormatter();

	if (log.items.length === 0)
		return <EmptyState icon={History} title={t("empty")} />;

	return (
		<div className="flex flex-col gap-4">
			<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
				{log.items.map((entry) => {
					const Icon = ICONS[entry.action];
					const target = entry.targetId ? (
						<Link
							href={`/admin/users/${entry.targetId}`}
							className="font-medium hover:text-primary hover:underline"
						>
							{entry.targetName}
						</Link>
					) : (
						<span className="font-medium">{entry.targetName}</span>
					);
					return (
						<li key={entry.id} className="flex items-start gap-3 px-3 py-2.5">
							<Icon
								className={
									entry.action === "BAN"
										? "mt-0.5 h-4 w-4 shrink-0 text-destructive"
										: "mt-0.5 h-4 w-4 shrink-0 text-primary"
								}
							/>
							<div className="min-w-0 flex-1 text-sm">
								<p>
									{t.rich(`actions.${entry.action}`, {
										actor: entry.actorName,
										target: () => target,
									})}
								</p>
								<p className="truncate text-xs text-muted-foreground">
									{format.dateTime(new Date(entry.createdAt), {
										dateStyle: "medium",
										timeStyle: "short",
									})}
									{entry.targetEmail && ` · ${entry.targetEmail}`}
									{entry.reason &&
										` · ${t("reason", { reason: entry.reason })}`}
								</p>
							</div>
						</li>
					);
				})}
			</ul>
			<UrlPagination page={log.page} pageCount={log.pageCount} />
		</div>
	);
}
