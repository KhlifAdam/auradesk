import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

/** A card that leads to a related page (studio profile, privacy…). */
export function LinkCard({
	href,
	icon: Icon,
	title,
	description,
}: {
	href: string;
	icon: LucideIcon;
	title: string;
	description: string;
}) {
	return (
		<Link
			href={href}
			className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/40"
		>
			<Icon className="h-4 w-4 shrink-0 text-primary" />
			<span className="flex flex-1 flex-col">
				<span className="text-sm font-semibold">{title}</span>
				<span className="text-xs text-muted-foreground">{description}</span>
			</span>
			<ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
		</Link>
	);
}
