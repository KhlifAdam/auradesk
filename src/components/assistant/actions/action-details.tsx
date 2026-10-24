"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { type ReactNode, useId } from "react";
import { Textarea } from "@/components/ui/textarea";
import type {
	WriteToolInput,
	WriteToolName,
} from "@/lib/ai/assistant/write-tools";
import { formatMoney } from "@/services/projects/money";

type AnyInput = WriteToolInput<WriteToolName>;

interface DetailsProps {
	name: WriteToolName;
	input: AnyInput;
	onChange: (input: AnyInput) => void;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-3 text-xs">
			<span className="text-muted-foreground">{label}</span>
			<span className="text-right font-medium">{children}</span>
		</div>
	);
}

function Note({ children }: { children: ReactNode }) {
	return <p className="text-xs text-muted-foreground">{children}</p>;
}

/** What exactly will happen, with the wording the user may still edit. */
export function ActionDetails({ name, input, onChange }: DetailsProps) {
	const t = useTranslations("Assistant.actions.details");
	const tStage = useTranslations("Projects.stages");
	const tMethod = useTranslations("Invoices.methods");
	const format = useFormatter();
	const locale = useLocale();
	const fieldId = useId();
	const edit = (patch: Partial<AnyInput>) =>
		onChange({ ...input, ...patch } as AnyInput);
	const date = (day: string) =>
		format.dateTime(new Date(`${day}T00:00:00Z`), {
			dateStyle: "medium",
			timeZone: "UTC",
		});

	switch (name) {
		case "send_message":
		case "decline_booking": {
			const field = name === "send_message" ? "body" : "reason";
			const value = (input as Record<string, string | undefined>)[field] ?? "";
			return (
				<div className="flex flex-col gap-1 text-xs text-muted-foreground">
					<label htmlFor={fieldId}>{t(field)}</label>
					<Textarea
						id={fieldId}
						value={value}
						rows={name === "send_message" ? 4 : 2}
						maxLength={name === "send_message" ? 4000 : 500}
						className="min-h-0 resize-none bg-card text-sm text-foreground"
						onChange={(event) => edit({ [field]: event.target.value })}
					/>
				</div>
			);
		}
		case "record_payment": {
			const i = input as WriteToolInput<"record_payment">;
			return (
				<div className="flex flex-col gap-1">
					<Fact label={t("amount")}>{formatMoney(i.amount, locale)}</Fact>
					<Fact label={t("paidAt")}>{date(i.paidAt)}</Fact>
					<Fact label={t("method")}>{tMethod(i.method)}</Fact>
				</div>
			);
		}
		case "set_project_stage":
			return (
				<Fact label={t("stage")}>
					{tStage((input as WriteToolInput<"set_project_stage">).stage)}
				</Fact>
			);
		case "share_gallery":
			return (
				<Note>
					{t(
						(input as WriteToolInput<"share_gallery">).shared
							? "share"
							: "unshare",
					)}
				</Note>
			);
		case "confirm_booking":
			return (
				<Note>
					{t(
						(input as WriteToolInput<"confirm_booking">).withoutClient
							? "confirmWithoutClient"
							: "confirm",
					)}
				</Note>
			);
		case "invite_client":
			return (
				<Fact label={t("contact")}>
					{(input as WriteToolInput<"invite_client">).contact}
				</Fact>
			);
		case "invite_team_member": {
			const i = input as WriteToolInput<"invite_team_member">;
			return (
				<div className="flex flex-col gap-1">
					<Fact label={t("name")}>{i.name}</Fact>
					<Fact label={t("email")}>{i.email}</Fact>
					{i.specialty && <Fact label={t("specialty")}>{i.specialty}</Fact>}
				</div>
			);
		}
		case "assign_team_member": {
			const role = (input as WriteToolInput<"assign_team_member">).role;
			return role ? <Fact label={t("role")}>{role}</Fact> : null;
		}
		case "send_quote":
		case "send_invoice":
			return <Note>{t("notifies")}</Note>;
		case "cancel_invoice":
			return <Note>{t("cancelInvoice")}</Note>;
		case "delete_booking":
		case "delete_invoice":
		case "delete_calendar_event":
		case "remove_team_member":
			return <Note>{t("irreversible")}</Note>;
		default:
			return null;
	}
}
