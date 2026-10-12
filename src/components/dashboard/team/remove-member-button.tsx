"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmDeleteButton } from "@/components/dashboard/shared/confirm-delete-button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { removeTeamMember } from "@/services/team/actions";

export function RemoveMemberButton({
	memberId,
	name,
}: {
	memberId: string;
	name: string;
}) {
	const t = useTranslations("Team.remove");
	const router = useRouter();
	const errorMessage = useErrorMessage();

	return (
		<ConfirmDeleteButton
			label={t("button")}
			title={t("title", { name })}
			description={t("description")}
			onConfirm={async () => {
				const result = await removeTeamMember(memberId);
				if (!result.ok) return void toast.error(errorMessage(result.error));
				toast.success(t("done"));
				router.refresh();
			}}
		/>
	);
}
