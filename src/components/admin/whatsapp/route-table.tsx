"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { SmsKey } from "@/lib/sms/sms-kinds";
import { setWhatsappRoute } from "@/services/whatsapp/route-actions";
import { WHATSAPP_CHANNELS } from "@/services/whatsapp/schemas";

type Channel = (typeof WHATSAPP_CHANNELS)[number];

interface RouteTableProps {
	routes: { kind: SmsKey; channel: Channel }[];
	/** Which channels can send right now; the others fall back to SMS. */
	ready: Record<Channel, boolean>;
}

/** One switch per kind of message: the linked number or the official API. */
export function RouteTable({ routes, ready }: RouteTableProps) {
	const t = useTranslations("Admin.whatsapp.routes");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();
	const [shown, setShown] = useOptimistic(
		routes,
		(current, next: { kind: SmsKey; channel: Channel }) =>
			current.map((route) => (route.kind === next.kind ? next : route)),
	);

	const change = (kind: SmsKey, channel: Channel) =>
		startTransition(async () => {
			setShown({ kind, channel });
			const result = await setWhatsappRoute({ kind, channel });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("saved"));
			router.refresh();
		});

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div className="flex flex-col gap-0.5">
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				<p className="text-xs text-muted-foreground">{t("description")}</p>
			</div>
			<ul className="divide-y divide-border">
				{shown.map(({ kind, channel }) => (
					<li
						key={kind}
						className="flex flex-wrap items-center justify-between gap-2 py-2"
					>
						<div className="flex min-w-0 flex-col">
							<span className="text-sm">{t(`kinds.${kind}`)}</span>
							{!ready[channel] && (
								<span className="flex items-center gap-1 text-[11px] text-destructive">
									<AlertTriangle className="h-3 w-3 shrink-0" />
									{t("notReady")}
								</span>
							)}
						</div>
						<ToggleGroup
							type="single"
							variant="outline"
							size="sm"
							value={channel}
							disabled={isPending}
							onValueChange={(next) =>
								next && next !== channel && change(kind, next as Channel)
							}
						>
							{WHATSAPP_CHANNELS.map((option) => (
								<ToggleGroupItem
									key={option}
									value={option}
									className="h-7 px-2.5 text-xs"
								>
									{t(option)}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</li>
				))}
			</ul>
		</section>
	);
}
