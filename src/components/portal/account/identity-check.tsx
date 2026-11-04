"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useAuthError } from "@/components/auth/use-auth-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	confirmIdentityCheck,
	type IdentityCheck,
	startIdentityCheck,
} from "@/services/account/identity-actions";

/**
 * First step of an email change: prove the account is yours, with a code sent
 * to your phone (or current email) and your password when you have one.
 */
export function IdentityGate({
	hasPassword,
	onVerified,
	onCancel,
}: {
	hasPassword: boolean;
	onVerified: () => void;
	onCancel: () => void;
}) {
	const t = useTranslations("Portal.account.identity");
	const authError = useAuthError();
	const [check, setCheck] = useState<IdentityCheck | null>(null);
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [busy, setBusy] = useState(false);

	async function send() {
		setBusy(true);
		const result = await startIdentityCheck();
		setBusy(false);
		if (!result.ok)
			return void toast.error(authError.message({ code: result.error }));
		setCheck(result.data);
		toast.success(t("codeSent"));
	}

	async function confirm(event: FormEvent) {
		event.preventDefault();
		setBusy(true);
		const result = await confirmIdentityCheck({
			password: hasPassword ? password : undefined,
			code,
		});
		setBusy(false);
		if (!result.ok)
			return void toast.error(authError.message({ code: result.error }));
		onVerified();
	}

	const cancel = (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			className="h-8 text-xs"
			onClick={onCancel}
		>
			{t("cancel")}
		</Button>
	);

	return (
		<form onSubmit={confirm} className="flex flex-col gap-2">
			<p className="flex items-center gap-2 text-xs text-muted-foreground">
				<ShieldCheck className="h-4 w-4 shrink-0" />
				{check ? t("codeSentTo", { hint: check.hint }) : t("intro")}
			</p>
			<div className="flex flex-wrap items-center gap-2">
				{hasPassword && (
					<Input
						type="password"
						autoComplete="current-password"
						placeholder={t("password")}
						aria-label={t("password")}
						className="h-8 w-48 text-sm"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
				)}
				{check ? (
					<>
						<Input
							inputMode="numeric"
							autoComplete="one-time-code"
							autoFocus
							maxLength={6}
							placeholder={t("code")}
							aria-label={t("code")}
							className="h-8 w-32 text-sm tracking-widest"
							value={code}
							onChange={(event) =>
								setCode(event.target.value.replace(/\D/g, ""))
							}
						/>
						<Button
							type="submit"
							size="sm"
							className="h-8 text-xs"
							disabled={busy || code.length !== 6 || (hasPassword && !password)}
						>
							{busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
							{t("continue")}
						</Button>
					</>
				) : (
					<Button
						type="button"
						size="sm"
						className="h-8 text-xs"
						disabled={busy}
						onClick={send}
					>
						{busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
						{t("sendCode")}
					</Button>
				)}
				{cancel}
			</div>
		</form>
	);
}
