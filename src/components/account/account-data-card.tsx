"use client";

import { Download, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmDeleteButton } from "@/components/dashboard/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { authClient } from "@/lib/auth/client";
import { deleteMyAccount } from "@/services/privacy/actions";

/**
 * GDPR rights in one card: download everything the platform holds about the
 * account, or delete the account. Shared by the studio and client spaces.
 */
export function AccountDataCard({ studio }: { studio: boolean }) {
	const t = useTranslations("Privacy.data");
	const errorMessage = useErrorMessage();

	async function onDelete() {
		const result = await deleteMyAccount();
		if (!result.ok) return void toast.error(errorMessage(result.error));
		// The sessions went with the account; this clears the browser's cookie.
		await authClient.signOut().catch(() => {});
		toast.success(t("deleted"));
		window.location.assign("/");
	}

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div className="flex items-start gap-2.5">
				<ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
				<div>
					<h2 className="text-sm font-semibold">{t("title")}</h2>
					<p className="text-xs text-muted-foreground">{t("description")}</p>
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Button
					asChild
					size="sm"
					variant="outline"
					className="h-8 gap-1.5 text-xs"
				>
					<a href="/api/account/export" download>
						<Download className="h-3.5 w-3.5" />
						{t("export")}
					</a>
				</Button>
				<ConfirmDeleteButton
					label={t("delete")}
					title={t("deleteTitle")}
					description={t(studio ? "deleteStudio" : "deleteClient")}
					onConfirm={onDelete}
				/>
			</div>
		</section>
	);
}
