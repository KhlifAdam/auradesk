"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { ActionResult } from "@/lib/action-result";

/** Runs an admin action: error toast on failure, success toast and refresh otherwise. */
export function useAdminAction() {
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();

	const run = (
		action: () => Promise<ActionResult>,
		done: string,
		after?: () => void,
	) =>
		startTransition(async () => {
			const result = await action();
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(done);
			after?.();
			router.refresh();
		});

	return { isPending, run };
}
