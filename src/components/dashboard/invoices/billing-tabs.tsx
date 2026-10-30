import { FileText, Receipt } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

// Quotes first: a quote comes before the invoice made from it.
const TABS = [
	{ key: "quotes", href: "/dashboard/invoices/quotes", icon: FileText },
	{ key: "invoices", href: "/dashboard/invoices", icon: Receipt },
] as const;

/** Switches between the invoices and the quotes lists. */
export async function BillingTabs({
	active,
}: {
	active: (typeof TABS)[number]["key"];
}) {
	const t = await getTranslations("Quotes.tabs");

	return (
		<nav className="flex w-fit gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
			{TABS.map(({ key, href, icon: Icon }) => (
				<Link
					key={key}
					href={href}
					aria-current={key === active ? "page" : undefined}
					className={cn(
						"flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors duration-200",
						key === active
							? "bg-card text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<Icon className="h-3.5 w-3.5" />
					{t(key)}
				</Link>
			))}
		</nav>
	);
}
