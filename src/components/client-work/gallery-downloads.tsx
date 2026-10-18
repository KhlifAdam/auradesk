import { Download, Heart, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { zipPartCounts } from "@/services/galleries/download";

/**
 * "Download everything" and "Download my picks" as ZIP files. Plain links: the
 * browser handles the (possibly very large) download itself. A big gallery
 * comes in several parts, one link each. Render only after an access check.
 */
export async function GalleryDownloads({
	galleryId,
	selectedCount,
	token,
}: {
	galleryId: string;
	selectedCount: number;
	/** Share-link token, for visitors without an account. */
	token?: string;
}) {
	const t = await getTranslations("Galleries.download");
	const parts = await zipPartCounts(galleryId);
	const base = `/api/galleries/${galleryId}/download${token ? `?t=${token}` : ""}`;

	return (
		<div className="flex flex-col gap-2">
			<ZipLinks
				href={base}
				parts={parts.all}
				label={t("all")}
				icon={Download}
				partLabel={(part) => t("zipPart", { part, total: parts.all })}
			/>
			{selectedCount > 0 && (
				<ZipLinks
					href={`${base}${token ? "&" : "?"}selected=1`}
					parts={parts.selected}
					label={t("selected", { count: selectedCount })}
					icon={Heart}
					variant="outline"
					partLabel={(part) => t("zipPart", { part, total: parts.selected })}
				/>
			)}
		</div>
	);
}

function ZipLinks({
	href,
	parts,
	label,
	icon: Icon,
	variant = "default",
	partLabel,
}: {
	href: string;
	parts: number;
	label: string;
	icon: LucideIcon;
	variant?: "default" | "outline";
	partLabel: (part: number) => string;
}) {
	const join = href.includes("?") ? "&" : "?";
	if (parts <= 1)
		return (
			<Button
				asChild
				size="sm"
				variant={variant}
				className="h-8 w-fit gap-1.5 text-xs"
			>
				<a href={href} download>
					<Icon className="h-3.5 w-3.5" />
					{label}
				</a>
			</Button>
		);

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<span className="flex items-center gap-1.5 text-xs font-medium">
				<Icon className="h-3.5 w-3.5" />
				{label}
			</span>
			{Array.from({ length: parts }, (_, i) => i + 1).map((part) => (
				<Button
					key={part}
					asChild
					size="sm"
					variant={variant}
					className="h-7 px-2.5 text-xs"
				>
					<a href={`${href}${join}part=${part}`} download>
						{partLabel(part)}
					</a>
				</Button>
			))}
		</div>
	);
}
