import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { formatBytes } from "@/lib/format";
import type { StorageOverview } from "@/services/admin/insights";

const PARTS = [
	{ key: "finals", bar: "bg-primary" },
	{ key: "proofs", bar: "bg-event-meeting" },
	{ key: "portfolio", bar: "bg-muted-foreground/50" },
] as const;

/** What the platform stores, by use, and the studios storing the most. */
export async function StorageCard({ storage }: { storage: StorageOverview }) {
	const t = await getTranslations("Admin.storage");
	const locale = await getLocale();
	const total = storage.finals + storage.proofs + storage.portfolio;
	const size = (bytes: number) => formatBytes(bytes, locale);

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div className="flex items-baseline justify-between gap-2">
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				<span className="font-display text-xl font-bold tabular-nums">
					{size(total)}
				</span>
			</div>
			<div className="flex h-2 overflow-hidden rounded-full bg-muted">
				{PARTS.map(({ key, bar }) => (
					<span
						key={key}
						className={bar}
						style={{ width: `${total ? (storage[key] / total) * 100 : 0}%` }}
					/>
				))}
			</div>
			<ul className="flex flex-col gap-1 text-xs">
				{PARTS.map(({ key, bar }) => (
					<li key={key} className="flex items-center justify-between gap-2">
						<span className="flex items-center gap-1.5">
							<span className={`h-2 w-2 rounded-full ${bar}`} />
							{t(key)}
						</span>
						<span className="tabular-nums text-muted-foreground">
							{size(storage[key])}
						</span>
					</li>
				))}
			</ul>
			<div className="flex flex-col gap-1 border-t border-border pt-3">
				<p className="text-xs font-medium">{t("top")}</p>
				{storage.top.length === 0 ? (
					<p className="text-xs text-muted-foreground">{t("empty")}</p>
				) : (
					<ol className="flex flex-col gap-1 text-xs">
						{storage.top.map((studio) => (
							<li key={studio.userId} className="flex justify-between gap-2">
								<Link
									href={`/admin/users/${studio.userId}`}
									className="truncate hover:text-primary hover:underline"
								>
									{studio.name}
								</Link>
								<span className="tabular-nums text-muted-foreground">
									{size(studio.bytes)}
								</span>
							</li>
						))}
					</ol>
				)}
			</div>
		</section>
	);
}
