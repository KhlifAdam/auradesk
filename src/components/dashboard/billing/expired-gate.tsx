"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** Still open once the plan is over: paying, and exporting or deleting data. */
const OPEN_PATHS = ["/dashboard/subscription", "/dashboard/privacy"];

/**
 * Once the free month or paid period is over, the dashboard is locked
 * except for the pages above. The public site stays online meanwhile.
 */
export function ExpiredGate({
	expired,
	children,
}: {
	expired: boolean;
	children: ReactNode;
}) {
	const t = useTranslations("Billing.locked");
	const pathname = usePathname();
	const open = OPEN_PATHS.some((path) => pathname.startsWith(path));
	if (!expired || open) return children;

	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<div className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center shadow-luminous">
				<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<Lock className="h-5 w-5" />
				</span>
				<h1 className="font-display text-lg font-semibold">{t("title")}</h1>
				<p className="text-sm text-muted-foreground">{t("description")}</p>
				<Button asChild size="sm" className="mt-2">
					<Link href="/dashboard/subscription">{t("action")}</Link>
				</Button>
				<Link
					href="/dashboard/privacy"
					className="text-xs text-muted-foreground hover:text-foreground"
				>
					{t("privacy")}
				</Link>
			</div>
		</div>
	);
}
