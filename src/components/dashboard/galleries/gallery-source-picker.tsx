"use client";

import { HardDrive, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type GallerySource = "files" | "drive";

const SOURCES = [
	{ source: "files", icon: Upload },
	{ source: "drive", icon: HardDrive },
] as const;

/** Upload the files here, or deliver a Google Drive link. */
export function GallerySourcePicker({
	value,
	onChange,
}: {
	value: GallerySource;
	onChange: (source: GallerySource) => void;
}) {
	const t = useTranslations("Galleries.source");

	return (
		<div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
			{SOURCES.map(({ source, icon: Icon }) => (
				<button
					key={source}
					type="button"
					aria-pressed={value === source}
					onClick={() => onChange(source)}
					className={cn(
						"flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-200",
						value === source
							? "bg-card text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<Icon className="h-3.5 w-3.5" />
					{t(source)}
				</button>
			))}
		</div>
	);
}
