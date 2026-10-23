import { Camera, ExternalLink } from "lucide-react";
import Image from "next/image";
import type { StudioBrand } from "@/services/clients/branding";

/** Photographer identity shown above their projects and galleries. */
export function StudioHeading({
	studio,
	fallbackName,
}: {
	studio: StudioBrand | null;
	fallbackName: string;
}) {
	const name = studio?.name ?? fallbackName;
	return (
		<div className="flex items-center gap-2.5">
			<div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
				{studio?.logoUrl ? (
					<Image
						src={studio.logoUrl}
						alt=""
						fill
						sizes="32px"
						className="object-contain"
					/>
				) : (
					<Camera className="h-4 w-4 text-muted-foreground" />
				)}
			</div>
			{studio?.published ? (
				// Their public site: portfolio, packages and contact.
				<a
					href={`/s/${studio.slug}`}
					target="_blank"
					rel="noopener noreferrer"
					className="group flex items-center gap-1 text-sm font-semibold transition-colors duration-200 hover:text-primary"
				>
					{name}
					<ExternalLink className="h-3 w-3 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
				</a>
			) : (
				<p className="text-sm font-semibold">{name}</p>
			)}
		</div>
	);
}
