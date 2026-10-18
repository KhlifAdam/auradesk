"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { useSmoothTheme } from "@/hooks/use-smooth-theme";
import { setLocale } from "@/i18n/actions";
import { LOCALES } from "@/i18n/config";
import { cn } from "@/lib/utils";

const THEMES = [
	{ value: "light", icon: Sun },
	{ value: "dark", icon: Moon },
	{ value: "system", icon: Monitor },
] as const;

const segment = (active: boolean) =>
	cn(
		"flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200",
		active
			? "bg-primary/10 text-primary"
			: "text-muted-foreground hover:text-foreground",
	);

/** Language (also used for this account's emails) and light/dark theme. */
export function PreferencesCard() {
	const t = useTranslations("Account.preferences");
	const tCommon = useTranslations("Common.languages");
	const tTheme = useTranslations("Dashboard.UserMenu.themes");
	const locale = useLocale();
	const router = useRouter();
	const { theme, setTheme } = useSmoothTheme();
	const [isPending, startTransition] = useTransition();
	// The theme is only known in the browser: mark it once mounted, so the
	// server's HTML and the first render agree.
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const changeLocale = (value: string) =>
		startTransition(async () => {
			await setLocale(value);
			router.refresh();
		});

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<h2 className="text-sm font-semibold">{t("title")}</h2>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<p className="text-xs font-medium">{t("language")}</p>
					<p className="text-[11px] text-muted-foreground">
						{t("languageHint")}
					</p>
				</div>
				<div className="inline-flex rounded-lg border border-border p-0.5">
					{LOCALES.map((value) => (
						<button
							key={value}
							type="button"
							disabled={isPending}
							aria-pressed={locale === value}
							onClick={() => changeLocale(value)}
							className={segment(locale === value)}
						>
							{tCommon(value)}
						</button>
					))}
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-xs font-medium">{t("theme")}</p>
				<div className="inline-flex rounded-lg border border-border p-0.5">
					{THEMES.map(({ value, icon: Icon }) => (
						<button
							key={value}
							type="button"
							aria-pressed={mounted && theme === value}
							onClick={() => setTheme(value)}
							className={segment(mounted && theme === value)}
						>
							<Icon className="h-3.5 w-3.5" />
							{tTheme(value)}
						</button>
					))}
				</div>
			</div>
		</section>
	);
}
