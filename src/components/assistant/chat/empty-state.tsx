"use client";

import { motion } from "framer-motion";
import {
	BookImage,
	BookOpen,
	CalendarDays,
	FolderKanban,
	Hourglass,
	Images,
	ListTodo,
	Receipt,
	Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

const PHOTOGRAPHER = [
	{ key: "today", icon: ListTodo },
	{ key: "pending", icon: BookOpen },
	{ key: "money", icon: Receipt },
	{ key: "forecast", icon: Hourglass },
	{ key: "week", icon: CalendarDays },
] as const;

const PORTAL = [
	{ key: "whereProject", icon: FolderKanban },
	{ key: "whatToDo", icon: ListTodo },
	{ key: "howChoose", icon: Images },
	{ key: "whatOwe", icon: Receipt },
	{ key: "photoBook", icon: BookImage },
] as const;

const TEAM = [
	{ key: "myProjects", icon: FolderKanban },
	{ key: "nextShoot", icon: CalendarDays },
] as const;

/** A welcome and a few one-tap questions to start with. */
export function EmptyState({
	team,
	portal,
	onPick,
}: {
	team: boolean;
	portal?: boolean;
	onPick: (question: string) => void;
}) {
	const t = useTranslations("Assistant.empty");
	const suggestions = portal ? PORTAL : team ? TEAM : PHOTOGRAPHER;

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-5 px-2 py-8 text-center">
			<motion.span
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/35 to-primary/5 text-primary shadow-luminous ring-1 ring-primary/30"
			>
				<Sparkles className="h-6 w-6" />
			</motion.span>
			<div className="flex flex-col gap-1">
				<h2 className="font-display text-lg font-semibold">{t("title")}</h2>
				<p className="max-w-xs text-xs text-muted-foreground">
					{t(portal ? "subtitlePortal" : team ? "subtitleTeam" : "subtitle")}
				</p>
			</div>
			<div className="flex w-full max-w-sm flex-col gap-1.5">
				{suggestions.map(({ key, icon: Icon }, index) => (
					<motion.button
						key={key}
						type="button"
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.05 * index + 0.1, duration: 0.3 }}
						onClick={() => onPick(t(`suggestions.${key}`))}
						className="group flex items-center gap-2.5 rounded-xl border border-border bg-card/70 px-3 py-2 text-left text-sm transition-all duration-300 hover:border-primary/40 hover:bg-primary/5"
					>
						<Icon className="h-4 w-4 shrink-0 text-primary transition-transform duration-300 group-hover:scale-110" />
						{t(`suggestions.${key}`)}
					</motion.button>
				))}
			</div>
		</div>
	);
}
