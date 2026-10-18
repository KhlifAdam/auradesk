"use client";

import { Laptop, Loader2, LogOut, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { revokeOtherSessions, revokeSession } from "@/services/account/actions";
import type { DeviceSession } from "@/services/account/types";

/** Where the account is signed in, and a way to sign other devices out. */
export function SessionsCard({
	sessions,
	now,
}: {
	sessions: DeviceSession[];
	/** The server's render time: "5 minutes ago" then reads the same on both sides. */
	now: string;
}) {
	const t = useTranslations("Account.sessions");
	const format = useFormatter();
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [busy, setBusy] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const others = sessions.filter((session) => !session.current).length;

	const signOut = (id: string) =>
		startTransition(async () => {
			setBusy(id);
			const result = await revokeSession(id);
			setBusy(null);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("signedOut"));
			router.refresh();
		});

	const signOutOthers = () =>
		startTransition(async () => {
			setBusy("others");
			const result = await revokeOtherSessions();
			setBusy(null);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("othersSignedOut", { count: result.data.count }));
			router.refresh();
		});

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div>
					<h2 className="text-sm font-semibold">{t("title")}</h2>
					<p className="text-xs text-muted-foreground">{t("hint")}</p>
				</div>
				{others > 0 && (
					<Button
						size="sm"
						variant="outline"
						className="h-7 gap-1.5 text-xs"
						disabled={isPending}
						onClick={signOutOthers}
					>
						{busy === "others" ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<LogOut className="h-3.5 w-3.5" />
						)}
						{t("signOutOthers")}
					</Button>
				)}
			</div>
			<ul className="flex flex-col divide-y divide-border">
				{sessions.map((session) => {
					const Icon = session.mobile ? Smartphone : Laptop;
					const device = [session.browser, session.os]
						.filter(Boolean)
						.join(" · ");
					return (
						<li
							key={session.id}
							className="flex items-center justify-between gap-2 py-2"
						>
							<span className="flex items-center gap-2.5">
								<Icon className="h-4 w-4 text-muted-foreground" />
								<span className="flex flex-col">
									<span className="text-sm">
										{device || t("unknownDevice")}
									</span>
									<span className="text-[11px] text-muted-foreground">
										{session.current
											? t("thisDevice")
											: t("lastActive", {
													when: format.relativeTime(
														new Date(session.lastActiveAt),
														new Date(now),
													),
												})}
									</span>
								</span>
							</span>
							{!session.current && (
								<Button
									size="sm"
									variant="ghost"
									className="h-7 text-xs text-muted-foreground hover:text-destructive"
									disabled={isPending}
									onClick={() => signOut(session.id)}
								>
									{busy === session.id && (
										<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
									)}
									{t("signOut")}
								</Button>
							)}
						</li>
					);
				})}
			</ul>
		</section>
	);
}
