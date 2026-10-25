import {
	Ban,
	CalendarClock,
	Camera,
	CircleCheck,
	FolderKanban,
	type LucideIcon,
	Sparkles,
	Users,
} from "lucide-react";
import type { CalendarEntry } from "@/services/calendar/types";

type EntryType = CalendarEntry["type"];

interface EventStyle {
	icon: LucideIcon;
	/** Small solid marker (legend, dots). */
	dot: string;
	/** Tinted chip on the grid and in lists. */
	chip: string;
	/** Accent bar on list rows. */
	bar: string;
}

/** Colors come from the `--event-*` tokens in globals.css. */
export const EVENT_STYLES: Record<EntryType, EventStyle> = {
	SHOOT: {
		icon: Camera,
		dot: "bg-event-shoot",
		chip: "bg-event-shoot/15 text-event-shoot hover:bg-event-shoot/25",
		bar: "bg-event-shoot",
	},
	MEETING: {
		icon: Users,
		dot: "bg-event-meeting",
		chip: "bg-event-meeting/15 text-event-meeting hover:bg-event-meeting/25",
		bar: "bg-event-meeting",
	},
	AVAILABLE: {
		icon: CircleCheck,
		dot: "bg-event-available",
		chip: "bg-event-available/15 text-event-available hover:bg-event-available/25",
		bar: "bg-event-available",
	},
	UNAVAILABLE: {
		icon: Ban,
		dot: "bg-event-unavailable",
		chip: "bg-event-unavailable/15 text-event-unavailable hover:bg-event-unavailable/25",
		bar: "bg-event-unavailable",
	},
	OTHER: {
		icon: Sparkles,
		dot: "bg-event-other",
		chip: "bg-event-other/15 text-event-other hover:bg-event-other/25",
		bar: "bg-event-other",
	},
	ESTIMATE: {
		icon: CalendarClock,
		dot: "bg-primary",
		chip: "border border-dashed border-primary/50 text-primary hover:bg-primary/10",
		bar: "bg-primary",
	},
	PROJECT: {
		icon: FolderKanban,
		dot: "bg-event-project",
		chip: "border border-dashed border-event-project/50 text-event-project hover:bg-event-project/10",
		bar: "bg-event-project",
	},
};

/** Day-cell background for days marked available / unavailable. */
export const AVAILABILITY_TINT = {
	AVAILABLE: "bg-event-available/8",
	UNAVAILABLE: "bg-event-unavailable/8",
} as const;
