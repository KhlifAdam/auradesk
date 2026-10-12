"use client";

import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import {
	acceptTeamInvitation,
	declineTeamInvitation,
} from "@/services/team/space-actions";
import type { TeamInvitation } from "@/services/team/types";

/** A studio's invitation to join its team, answered with Accept / Decline. */
export function TeamInvitationCard({
	invitation,
}: {
	invitation: TeamInvitation;
}) {
	const t = useTranslations("TeamSpace.invitations");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();

	const answer = (accept: boolean) =>
		startTransition(async () => {
			const action = accept ? acceptTeamInvitation : declineTeamInvitation;
			const result = await action(invitation.id);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(accept ? t("accepted") : t("declined"));
			router.refresh();
		});

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
			<div className="min-w-0 flex-1">
				<p className="font-medium">
					{t("from", { studio: invitation.studioName })}
				</p>
				{invitation.specialty && (
					<p className="text-xs text-muted-foreground">
						{t("as", { specialty: invitation.specialty })}
					</p>
				)}
			</div>
			<div className="flex gap-2">
				<Button
					size="sm"
					variant="outline"
					className="h-8 gap-1.5 text-xs"
					disabled={isPending}
					onClick={() => answer(false)}
				>
					<X className="h-3.5 w-3.5" />
					{t("decline")}
				</Button>
				<Button
					size="sm"
					className="h-8 gap-1.5 text-xs"
					disabled={isPending}
					onClick={() => answer(true)}
				>
					{isPending ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<Check className="h-3.5 w-3.5" />
					)}
					{t("accept")}
				</Button>
			</div>
		</div>
	);
}
