import { Aperture } from "lucide-react";
import { cn } from "@/lib/utils";

/** The AuraDesk mark; `size="lg"` for places where the brand leads (the studio menu). */
export function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
	return (
		<span
			className={cn(
				"grid shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-luminous",
				size === "lg" ? "size-9 rounded-xl" : "size-8",
			)}
		>
			<Aperture className={size === "lg" ? "size-5" : "size-4"} />
		</span>
	);
}
