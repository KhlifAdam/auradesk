"use client";

import { Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { useBookTray } from "./use-book-tray";

interface PhotoTrayProps {
	tray: ReturnType<typeof useBookTray>;
	/** How many times each photo is already used in the book. */
	used: Map<string, number>;
	/** What clicking a photo does, said out loud to screen readers. */
	pickLabel: string;
	onPick: (itemId: string) => void;
}

/** The project's delivered photos: click one to put it where the book is pointing. */
export function PhotoTray({ tray, used, pickLabel, onPick }: PhotoTrayProps) {
	const t = useTranslations("PhotoBook.editor.tray");
	const [hideUsed, setHideUsed] = useState(false);
	const switchId = useId();
	const shown = hideUsed
		? tray.items.filter((p) => !used.has(p.id))
		: tray.items;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
				<span>
					{t("count", { shown: tray.items.length, total: tray.total })}
				</span>
				<div className="flex items-center gap-1.5">
					<label htmlFor={switchId} className="cursor-pointer">
						{t("hideUsed")}
					</label>
					<Switch
						id={switchId}
						checked={hideUsed}
						onCheckedChange={setHideUsed}
					/>
				</div>
			</div>
			<p className="text-[11px] text-muted-foreground">{pickLabel}</p>
			<ul className="grid grid-cols-3 gap-1.5">
				{shown.map((photo) => {
					const count = used.get(photo.id) ?? 0;
					return (
						<li key={photo.id} className="relative aspect-square">
							<button
								type="button"
								title={photo.filename}
								aria-label={photo.filename}
								onClick={() => onPick(photo.id)}
								className={cn(
									"relative h-full w-full cursor-pointer overflow-hidden rounded-md bg-muted transition-all duration-200 hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
									count > 0 && "opacity-70",
								)}
							>
								<Image
									src={photo.url}
									alt=""
									fill
									unoptimized
									sizes="96px"
									className="object-cover"
								/>
							</button>
							{count > 0 && (
								<span className="pointer-events-none absolute right-1 bottom-1 flex h-4 min-w-4 items-center justify-center gap-0.5 rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
									<Check className="h-2.5 w-2.5" />
									{count > 1 && count}
								</span>
							)}
						</li>
					);
				})}
			</ul>
			{!tray.loading && !tray.failed && shown.length === 0 && (
				<p className="py-4 text-center text-xs text-muted-foreground">
					{t(hideUsed ? "allUsed" : "empty")}
				</p>
			)}
			{tray.failed && <p className="text-xs text-destructive">{t("failed")}</p>}
			{(tray.hasMore || tray.failed) && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-8 text-xs"
					disabled={tray.loading}
					onClick={() => void tray.loadMore()}
				>
					{tray.loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
					{t(tray.failed ? "retry" : "loadMore")}
				</Button>
			)}
			{tray.loading && tray.items.length === 0 && (
				<div className="grid grid-cols-3 gap-1.5">
					{Array.from({ length: 9 }, (_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders.
							key={i}
							className="aspect-square animate-pulse rounded-md bg-muted"
						/>
					))}
				</div>
			)}
		</div>
	);
}
