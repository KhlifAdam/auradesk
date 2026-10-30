"use client";

import { CircleHelp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EVENT_STYLES } from "./event-styles";

const GUIDE = [
	"SHOOT",
	"PROJECT",
	"MEETING",
	"OTHER",
	"UNAVAILABLE",
	"ESTIMATE",
] as const;

/** Explains what each color on the calendar means. */
export function ColorGuide() {
	const t = useTranslations("Calendar");

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
					<CircleHelp className="h-3.5 w-3.5" />
					{t("guide.button")}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 p-3">
				<p className="mb-2 text-xs font-semibold">{t("guide.title")}</p>
				<ul className="flex flex-col gap-2">
					{GUIDE.map((type) => {
						const { icon: Icon, chip } = EVENT_STYLES[type];
						return (
							<li key={type} className="flex items-start gap-2">
								<span
									className={cn(
										"flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
										chip,
									)}
								>
									<Icon className="h-3.5 w-3.5" />
								</span>
								<span className="flex flex-col">
									<span className="text-xs font-medium">
										{t(`types.${type}`)}
									</span>
									<span className="text-[11px] text-muted-foreground">
										{t(`guide.${type}`)}
									</span>
								</span>
							</li>
						);
					})}
				</ul>
			</PopoverContent>
		</Popover>
	);
}
