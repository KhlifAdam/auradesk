"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { AUTH_PATHS, type AuthAudience } from "@/lib/auth/client-intent";
import type { SocialProvider } from "@/lib/auth/social-providers";
import {
	clearClientIntent,
	setClientIntent,
} from "@/services/auth/intent-actions";
import { GithubIcon, GoogleIcon } from "./brand-icons";

const ICONS = { github: GithubIcon, google: GoogleIcon } as const;

/** Codes Better Auth puts in `?error=` when the provider round trip fails. */
const OAUTH_ERRORS = [
	"access_denied",
	"unable_to_link_account",
	"email_not_found",
	"BANNED_USER",
] as const;

export interface SocialLoginProps {
	/** Providers set up on the server; nothing renders without any. */
	providers: SocialProvider[];
	audience: AuthAudience;
	disabled?: boolean;
	/** `?error=` from a failed provider round trip, shown once. */
	oauthError?: string;
}

/** "Or continue with" divider + provider buttons. */
export function SocialLogin({
	providers,
	audience,
	disabled,
	oauthError,
}: SocialLoginProps) {
	const t = useTranslations("Auth.shared");
	const tError = useTranslations("Auth.oauthErrors");
	const [pending, setPending] = useState<SocialProvider | null>(null);

	useEffect(() => {
		if (!oauthError) return;
		const known = OAUTH_ERRORS.find((code) => code === oauthError);
		toast.error(tError(known ?? "generic"));
	}, [oauthError, tError]);

	if (providers.length === 0) return null;

	async function signIn(provider: SocialProvider) {
		setPending(provider);
		try {
			// The intent decides the role if OAuth creates a new account.
			await (audience === "client" ? setClientIntent() : clearClientIntent());
			const paths = AUTH_PATHS[audience];
			const { error } = await authClient.signIn.social({
				provider,
				callbackURL: paths.home,
				newUserCallbackURL: paths.home,
				// Failures come back to this page, not to Better Auth's error page.
				errorCallbackURL: paths.login,
			});
			// On success the browser is already leaving for the provider.
			if (error) throw error;
		} catch {
			toast.error(tError("generic"));
			setPending(null);
		}
	}

	return (
		<>
			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center text-xs uppercase">
					<span className="bg-background px-2 text-muted-foreground">
						{t("divider")}
					</span>
				</div>
			</div>

			<div className={providers.length > 1 ? "grid grid-cols-2 gap-4" : "grid"}>
				{providers.map((id) => {
					const Icon = ICONS[id];
					return (
						<Button
							key={id}
							variant="outline"
							type="button"
							disabled={disabled || pending !== null}
							onClick={() => signIn(id)}
						>
							{pending === id ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Icon className="mr-2 h-4 w-4" />
							)}
							{t(id)}
						</Button>
					);
				})}
			</div>
		</>
	);
}
