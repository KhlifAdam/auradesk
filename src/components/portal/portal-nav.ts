import {
	Contact,
	FolderOpen,
	type LucideIcon,
	MessageSquare,
	Receipt,
	UserRound,
} from "lucide-react";

export interface PortalNavItem {
	key: "projects" | "studios" | "messages" | "invoices" | "profile";
	href: string;
	icon: LucideIcon;
	/** Which pages keep this entry lit. */
	prefixes: string[];
}

/** The client space's main places, shared by the top bar and the phone's bottom bar. */
export const PORTAL_NAV: PortalNavItem[] = [
	{
		key: "projects",
		href: "/portal",
		icon: FolderOpen,
		prefixes: [
			"/portal/projects",
			"/portal/galleries",
			"/portal/bookings",
			"/portal/books",
		],
	},
	{
		key: "studios",
		href: "/portal/studios",
		icon: Contact,
		prefixes: ["/portal/studios"],
	},
	{
		key: "messages",
		href: "/portal/messages",
		icon: MessageSquare,
		prefixes: ["/portal/messages"],
	},
	{
		key: "invoices",
		href: "/portal/invoices",
		icon: Receipt,
		prefixes: ["/portal/invoices"],
	},
	{
		key: "profile",
		href: "/portal/account",
		icon: UserRound,
		prefixes: ["/portal/account", "/portal/settings"],
	},
];

/** True when `pathname` belongs to this entry. */
export function isNavActive(item: PortalNavItem, pathname: string) {
	if (item.href === "/portal" && pathname === "/portal") return true;
	return item.prefixes.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}
