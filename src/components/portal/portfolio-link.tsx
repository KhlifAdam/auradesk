import { Images } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Opens a photographer's public site, where their portfolio lives. */
export function PortfolioLink({
	slug,
	className,
}: {
	slug: string;
	className?: string;
}) {
	const t = useTranslations("Portal.studios");
	return (
		<Button
			asChild
			variant="outline"
			size="sm"
			className={cn("h-8 gap-1.5 text-xs", className)}
		>
			<a href={`/s/${slug}`} target="_blank" rel="noopener noreferrer">
				<Images className="h-3.5 w-3.5" />
				{t("portfolio")}
			</a>
		</Button>
	);
}
