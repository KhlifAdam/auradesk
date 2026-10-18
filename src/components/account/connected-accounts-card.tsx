"use client";

import { Link2, Loader2, Unlink } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { GithubIcon, GoogleIcon } from "@/components/auth/brand-icons";
import { useAuthError } from "@/components/auth/use-auth-error";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import type { SocialProvider } from "@/lib/auth/social-providers";

const ICONS = { github: GithubIcon, google: GoogleIcon } as const;

/**
 * Google / GitHub sign-in for this account: link one (a round trip to the
 * provider), or unlink it. The last way to sign in can't be removed.
 */
export function ConnectedAccountsCard({
	providers,
	linked,
}: {
	/** Providers set up on the server; the card hides without any. */
	providers: SocialProvider[];
	linked: { provider: string; accountId: string }[];
}) {
	const t = useTranslations("Account.connected");
	const tProvider = useTranslations("Auth.shared");
	const authError = useAuthError();
	const router = useRouter();
	const pathname = usePathname();
	const [pending, setPending] = useState<SocialProvider | null>(null);

	if (providers.length === 0) return null;

	const link = async (provider: SocialProvider) => {
		setPending(provider);
		const { error } = await authClient.linkSocial({
			provider,
			callbackURL: pathname,
		});
		// On success the browser is already leaving for the provider.
		if (error) {
			toast.error(authError.message(error));
			setPending(null);
		}
	};

	const unlink = async (provider: SocialProvider, accountId: string) => {
		setPending(provider);
		const { error } = await authClient.unlinkAccount({ accountId });
		setPending(null);
		if (error) return void toast.error(authError.message(error));
		toast.success(t("unlinked", { provider: tProvider(provider) }));
		router.refresh();
	};

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div>
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				<p className="text-xs text-muted-foreground">{t("hint")}</p>
			</div>
			<ul className="flex flex-col divide-y divide-border">
				{providers.map((provider) => {
					const Icon = ICONS[provider];
					const account = linked.find((l) => l.provider === provider);
					const isLinked = Boolean(account);
					return (
						<li
							key={provider}
							className="flex items-center justify-between gap-2 py-2"
						>
							<span className="flex items-center gap-2 text-sm">
								<Icon className="h-4 w-4" />
								{tProvider(provider)}
								{isLinked && (
									<span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
										{t("linked")}
									</span>
								)}
							</span>
							<Button
								size="sm"
								variant={isLinked ? "ghost" : "outline"}
								className="h-7 gap-1.5 text-xs"
								disabled={pending !== null}
								onClick={() =>
									account ? unlink(provider, account.accountId) : link(provider)
								}
							>
								{pending === provider ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : isLinked ? (
									<Unlink className="h-3.5 w-3.5" />
								) : (
									<Link2 className="h-3.5 w-3.5" />
								)}
								{t(isLinked ? "unlink" : "link")}
							</Button>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
