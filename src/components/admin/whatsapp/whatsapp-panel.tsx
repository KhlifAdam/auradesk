"use client";

import { Loader2, QrCode, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import {
	fetchWhatsappStatus,
	requestWhatsappLink,
	unlinkWhatsapp,
} from "@/services/whatsapp/actions";
import type { WhatsappView } from "@/services/whatsapp/queries";
import { WhatsappQr } from "./whatsapp-qr";
import { WhatsappTestForm } from "./whatsapp-test-form";
import { WhatsappUnlinkButton } from "./whatsapp-unlink-button";

/** Fast enough to follow a QR code (it changes every ~20s) and a scan. */
const POLL_MS = 3000;

/** The WhatsApp sender: its live status, the QR code to link it, a test. */
export function WhatsappPanel({ initial }: { initial: WhatsappView }) {
	const t = useTranslations("Admin.whatsapp");
	const format = useFormatter();
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();
	const { data = initial, mutate } = useSWR(
		"whatsapp-status",
		() => fetchWhatsappStatus(),
		{ fallbackData: initial, refreshInterval: POLL_MS },
	);

	const run = (action: typeof requestWhatsappLink, done?: string) =>
		startTransition(async () => {
			const result = await action();
			if (!result.ok) return void toast.error(errorMessage(result.error));
			await mutate(
				{ kind: "live", status: result.data },
				{ revalidate: false },
			);
			if (done) toast.success(done);
			router.refresh();
		});

	if (data.kind !== "live")
		return (
			<Shell state={data.kind} label={t(`states.${data.kind}`)}>
				<p className="text-xs text-muted-foreground">
					{t(`hints.${data.kind}`)}
				</p>
			</Shell>
		);

	const { state, qr, phone, since, lastError } = data.status;
	const sinceLabel = format.relativeTime(new Date(since), new Date());

	return (
		<Shell state={state} label={t(`states.${state}`)}>
			{state === "CONNECTED" && (
				<div className="flex flex-wrap items-center justify-between gap-2 text-sm">
					<p>
						{t.rich("connectedAs", {
							number: phone ? formatPhone(phone) : "?",
							since: sinceLabel,
							strong: (chunks) => (
								<strong className="font-semibold">{chunks}</strong>
							),
						})}
					</p>
					<WhatsappUnlinkButton
						disabled={isPending}
						onConfirm={() => run(unlinkWhatsapp, t("unlink.done"))}
					/>
				</div>
			)}
			{state === "QR_PENDING" && <WhatsappQr qr={qr} />}
			{(state === "LOGGED_OUT" || state === "CONNECTING") && (
				<div className="flex flex-col gap-2">
					<p className="text-xs text-muted-foreground">
						{t(`hints.${state}`, { since: sinceLabel })}
					</p>
					{lastError && (
						<p className="text-xs text-muted-foreground">
							{t("lastError", { error: lastError })}
						</p>
					)}
					<Button
						size="sm"
						className="h-7 w-fit gap-1.5 text-xs"
						disabled={isPending}
						onClick={() => run(requestWhatsappLink)}
					>
						{isPending ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : state === "LOGGED_OUT" ? (
							<QrCode className="h-3.5 w-3.5" />
						) : (
							<RefreshCw className="h-3.5 w-3.5" />
						)}
						{t(state === "LOGGED_OUT" ? "link" : "retry")}
					</Button>
				</div>
			)}
			{state === "CONNECTED" && (
				<div className="border-t border-border pt-3">
					<WhatsappTestForm />
				</div>
			)}
		</Shell>
	);
}

function Shell({
	state,
	label,
	children,
}: {
	state: string;
	label: string;
	children: React.ReactNode;
}) {
	const t = useTranslations("Admin.whatsapp");
	const tone =
		state === "CONNECTED"
			? "border-primary/40 text-primary"
			: state === "QR_PENDING" || state === "CONNECTING"
				? "border-border text-muted-foreground"
				: "border-destructive/40 text-destructive";

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<h2 className="flex items-center gap-2 text-sm font-semibold">
				{t("sender")}
				<Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", tone)}>
					{label}
				</Badge>
			</h2>
			{children}
		</section>
	);
}
