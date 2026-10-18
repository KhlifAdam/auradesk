"use client";

import { Monitor, Moon, Sun, SunMoon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useSmoothTheme } from "@/hooks/use-smooth-theme";

const THEMES = [
	{ value: "light", icon: Sun },
	{ value: "dark", icon: Moon },
	{ value: "system", icon: Monitor },
] as const;

export function ThemeSubmenu() {
	const t = useTranslations("Dashboard.UserMenu");
	const { theme, setTheme } = useSmoothTheme();

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger className="cursor-pointer">
				<SunMoon className="mr-2 h-4 w-4" />
				<span>{t("theme")}</span>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				<DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
					{THEMES.map(({ value, icon: Icon }) => (
						<DropdownMenuRadioItem key={value} value={value}>
							<Icon className="mr-2 h-4 w-4" />
							{t(`themes.${value}`)}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}
