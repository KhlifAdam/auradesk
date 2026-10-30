import { Camera, Clock, ListChecks, Package, Star } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { MediaThumb } from "@/components/dashboard/media/media-thumb";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PackageItem } from "@/services/packages/types";

interface PackageCardProps {
	pkg: PackageItem;
	onSelect: () => void;
}

export function PackageCard({ pkg, onSelect }: PackageCardProps) {
	const t = useTranslations("Services");
	const format = useFormatter();
	const hours = pkg.durationMinutes ? pkg.durationMinutes / 60 : null;

	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"group flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-all duration-300 hover:border-primary/50 hover:shadow-luminous",
				!pkg.active && "opacity-60",
			)}
		>
			{pkg.cover ? (
				<MediaThumb
					media={pkg.cover}
					sizes="(min-width: 1280px) 20vw, 33vw"
					className="aspect-[16/9]"
				/>
			) : (
				<div className="flex aspect-[16/9] items-center justify-center bg-muted">
					<Package className="h-5 w-5 text-muted-foreground" />
				</div>
			)}
			<div className="flex flex-col gap-1.5 p-2.5">
				<div className="flex items-start justify-between gap-2">
					<span className="truncate text-sm font-medium">{pkg.name}</span>
					<span className="shrink-0 text-sm font-semibold text-primary">
						{format.number(pkg.price, {
							style: "currency",
							currency: pkg.currency,
							maximumFractionDigits: 2,
						})}
					</span>
				</div>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
					{(hours !== null || pkg.unlimitedDuration) && (
						<span className="flex items-center gap-1">
							<Clock className="h-3 w-3" />
							{hours !== null
								? t("hours", { count: Number(hours.toFixed(1)) })
								: t("unlimitedTime")}
						</span>
					)}
					{(pkg.photoCount !== null || pkg.unlimitedPhotos) && (
						<span className="flex items-center gap-1">
							<Camera className="h-3 w-3" />
							{pkg.photoCount !== null
								? t("photos", { count: pkg.photoCount })
								: t("unlimitedPhotos")}
						</span>
					)}
					<span className="flex items-center gap-1">
						<ListChecks className="h-3 w-3" />
						{t("deliverableCount", { count: pkg.deliverables.length })}
					</span>
				</div>
				<div className="flex gap-1">
					{pkg.featured && (
						<Badge className="h-5 gap-1 px-1.5 text-[10px]">
							<Star className="h-2.5 w-2.5 fill-current" />
							{t("featured")}
						</Badge>
					)}
					{!pkg.active && (
						<Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
							{t("hidden")}
						</Badge>
					)}
				</div>
			</div>
		</button>
	);
}
