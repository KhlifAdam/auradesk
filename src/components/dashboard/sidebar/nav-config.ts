import {
	BookOpen,
	Briefcase,
	CalendarDays,
	FolderKanban,
	Images,
	LayoutGrid,
	Library,
	type LucideIcon,
	Mail,
	Package,
	Palette,
	Receipt,
	ShieldCheck,
	Store,
	Users,
	UsersRound,
} from "lucide-react";
import type { Messages } from "next-intl";

type NavKey = keyof Messages["Dashboard"]["Nav"];

export interface NavLink {
	href: string;
	labelKey: NavKey;
	icon: LucideIcon;
	/** Only active on an exact path match (for routes that prefix others). */
	exact?: boolean;
}

export interface NavGroup {
	labelKey: NavKey;
	items: NavLink[];
}

export const NAV_GROUPS: NavGroup[] = [
	{
		labelKey: "workspace",
		items: [
			{
				href: "/dashboard",
				labelKey: "overview",
				icon: LayoutGrid,
				exact: true,
			},
			{ href: "/dashboard/calendar", labelKey: "calendar", icon: CalendarDays },
			{ href: "/dashboard/bookings", labelKey: "bookings", icon: BookOpen },
			{ href: "/dashboard/clients", labelKey: "clients", icon: Users },
			{ href: "/dashboard/projects", labelKey: "projects", icon: FolderKanban },
			{ href: "/dashboard/invoices", labelKey: "invoices", icon: Receipt },
			{ href: "/dashboard/equipment", labelKey: "equipment", icon: Package },
			{ href: "/dashboard/team", labelKey: "team", icon: UsersRound },
			{ href: "/dashboard/messages", labelKey: "messages", icon: Mail },
			{ href: "/dashboard/privacy", labelKey: "privacy", icon: ShieldCheck },
		],
	},
	{
		labelKey: "website",
		items: [
			{ href: "/dashboard/media", labelKey: "media", icon: Library },
			{ href: "/dashboard/portfolio", labelKey: "portfolio", icon: Images },
			{ href: "/dashboard/services", labelKey: "services", icon: Briefcase },
			{
				href: "/dashboard/site",
				labelKey: "siteProfile",
				icon: Store,
				exact: true,
			},
			{
				href: "/dashboard/site/appearance",
				labelKey: "appearance",
				icon: Palette,
			},
		],
	},
];
