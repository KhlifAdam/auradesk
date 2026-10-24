"use client";

import {
	AlertTriangle,
	Check,
	CircleSlash,
	Loader2,
	ShieldCheck,
	Trash2,
	Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	WRITE_TOOLS,
	type WriteToolInput,
	type WriteToolName,
	type WriteToolOutput,
} from "@/lib/ai/assistant/write-tools";
import { cn } from "@/lib/utils";
import { ActionDetails } from "./action-details";
import { ActionTargets, useActionTargets } from "./action-targets";

interface ActionCardProps {
	name: WriteToolName;
	input: WriteToolInput<WriteToolName> | undefined;
	/** Set once the action ran, was cancelled or failed. */
	output: WriteToolOutput | undefined;
	streaming: boolean;
	onSettle: (
		input: WriteToolInput<WriteToolName> | null,
	) => Promise<WriteToolOutput>;
}

const TIER_ICON = { auto: Zap, confirm: ShieldCheck, danger: Trash2 };

/**
 * A change the assistant proposes. Confirm and danger actions wait for the
 * user; what they touch is read from the database, never taken on trust.
 */
export function ActionCard({
	name,
	input,
	output,
	streaming,
	onSettle,
}: ActionCardProps) {
	const t = useTranslations("Assistant.actions");
	const tier = WRITE_TOOLS[name].tier;
	const [draft, setDraft] = useState(input);
	const [running, setRunning] = useState(false);
	const targets = useActionTargets(streaming || output ? undefined : input);
	const Icon = TIER_ICON[tier];
	const danger = tier === "danger";
	const value = draft ?? input;

	const settle = async (confirmed: boolean) => {
		setRunning(true);
		await onSettle(confirmed && value ? value : null);
		setRunning(false);
	};

	if (tier === "auto" || output)
		return <ActionResultChip name={name} output={output} />;

	return (
		<div
			className={cn(
				"flex flex-col gap-2.5 rounded-xl border p-3 text-sm",
				danger
					? "border-destructive/40 bg-destructive/5"
					: "border-primary/30 bg-primary/5",
			)}
		>
			<div className="flex items-center gap-2">
				<span
					className={cn(
						"flex h-6 w-6 items-center justify-center rounded-md",
						danger
							? "bg-destructive/15 text-destructive"
							: "bg-primary/15 text-primary",
					)}
				>
					<Icon className="h-3.5 w-3.5" />
				</span>
				<p className="font-medium">{t(`titles.${name}`)}</p>
			</div>

			{streaming || !value ? (
				<div className="h-10 animate-pulse rounded-lg bg-muted/60" />
			) : (
				<>
					<ActionTargets targets={targets} />
					<ActionDetails
						name={name}
						input={value}
						onChange={(next) => setDraft(next)}
					/>
				</>
			)}

			{targets === null && (
				<p className="flex items-center gap-1.5 text-xs text-destructive">
					<AlertTriangle className="h-3.5 w-3.5" />
					{t("notFound")}
				</p>
			)}

			<div className="flex justify-end gap-2">
				<Button
					type="button"
					size="sm"
					variant="ghost"
					disabled={running || streaming}
					onClick={() => settle(false)}
				>
					{t("cancel")}
				</Button>
				<Button
					type="button"
					size="sm"
					variant={danger ? "destructive" : "default"}
					disabled={running || streaming || !targets}
					onClick={() => settle(true)}
				>
					{running && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
					{t(danger ? "delete" : "confirm")}
				</Button>
			</div>
		</div>
	);
}

/** One line once an action is settled (or while an automatic one runs). */
function ActionResultChip({
	name,
	output,
}: {
	name: WriteToolName;
	output: WriteToolOutput | undefined;
}) {
	const t = useTranslations("Assistant.actions");
	const status = output?.status ?? "running";
	const Icon = {
		running: Loader2,
		done: Check,
		cancelled: CircleSlash,
		failed: AlertTriangle,
	}[status];

	return (
		<div
			className={cn(
				"flex w-fit max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
				status === "done" && "border-success/30 bg-success/10 text-success",
				status === "failed" &&
					"border-destructive/30 bg-destructive/10 text-destructive",
				(status === "cancelled" || status === "running") &&
					"border-border bg-muted/50 text-muted-foreground",
			)}
		>
			<Icon
				className={cn(
					"h-3.5 w-3.5 shrink-0",
					status === "running" && "animate-spin",
				)}
			/>
			<span className="truncate">
				{t(`status.${status}`, { action: t(`titles.${name}`) })}
				{output?.status === "failed" && ` · ${output.error}`}
			</span>
		</div>
	);
}
