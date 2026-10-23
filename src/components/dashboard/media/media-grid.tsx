"use client";

import { motion } from "framer-motion";
import { ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { MediaItem } from "@/services/media/types";
import { MediaDetailSheet } from "./media-detail-sheet";
import { MediaThumb } from "./media-thumb";

export function MediaGrid({ items }: { items: MediaItem[] }) {
	const t = useTranslations("Media");
	const [openId, setOpenId] = useState<string | null>(null);
	const selected = items.find((item) => item.id === openId) ?? null;

	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
				<ImageOff className="h-8 w-8 text-muted-foreground" />
				<p className="text-sm font-medium">{t("empty.title")}</p>
				<p className="text-xs text-muted-foreground">
					{t("empty.description")}
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="grid grid-cols-3 gap-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
				{items.map((media, index) => (
					<motion.button
						key={media.id}
						type="button"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
						onClick={() => setOpenId(media.id)}
						className="group overflow-hidden rounded-lg border border-border bg-card text-left transition-all duration-300 hover:border-primary/50 hover:shadow-luminous focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<MediaThumb
							media={media}
							eager={index < 8}
							className="transition-transform duration-500 group-hover:scale-[1.03]"
						/>
						<p className="truncate px-2 py-1 text-[11px] text-muted-foreground">
							{media.filename}
						</p>
					</motion.button>
				))}
			</div>
			<MediaDetailSheet
				media={selected}
				onOpenChange={(open) => !open && setOpenId(null)}
			/>
		</>
	);
}
