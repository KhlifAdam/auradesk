import { BrandMark } from "@/components/landing/brand-mark";
import { BRAND_NAME } from "@/lib/brand";

/** The product's mark at the top of the studio menu; the person shows at the bottom. */
export function SidebarLogo() {
	return (
		<div className="flex items-center gap-3 px-1.5">
			<BrandMark size="lg" />
			<span className="truncate font-display text-lg font-bold tracking-tight text-foreground">
				{BRAND_NAME}
			</span>
		</div>
	);
}
