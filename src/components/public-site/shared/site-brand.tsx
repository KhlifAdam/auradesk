import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SiteStudio } from "@/services/public-site/types";

/** Logo (if any) + studio name; each template styles the text via className. */
export function SiteBrand({
	studio,
	className,
}: {
	studio: SiteStudio;
	className?: string;
}) {
	return (
		<a href="#top" className="flex items-center gap-3">
			{studio.logo && (
				<Image
					src={studio.logo.url}
					style={{ objectPosition: studio.logo.focus }}
					alt=""
					width={36}
					height={36}
					className="h-9 w-9 rounded-full object-cover"
				/>
			)}
			<span className={cn("site-heading text-lg", className)}>
				{studio.name}
			</span>
		</a>
	);
}
