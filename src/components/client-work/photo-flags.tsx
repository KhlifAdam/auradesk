import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PhotoFlag } from "@/services/ai/options";

/** What the AI assistant noticed on a photo, as small chips over the tile. */
export function PhotoFlags({ flags }: { flags: string[] }) {
	const t = useTranslations("Ai.flags");
	if (flags.length === 0) return null;

	return (
		<div className="pointer-events-none absolute bottom-1.5 left-1.5 flex max-w-[75%] flex-wrap gap-1">
			{flags.map((flag) => (
				<span
					key={flag}
					className="flex items-center gap-1 rounded-full bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur"
				>
					<Sparkles className="h-2.5 w-2.5 text-primary" />
					{t(flag as PhotoFlag)}
				</span>
			))}
		</div>
	);
}
