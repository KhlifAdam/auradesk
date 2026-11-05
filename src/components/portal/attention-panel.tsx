import { BellRing } from "lucide-react";
import type { ReactNode } from "react";

/** A tinted block with a pulsing bell, for what is waiting on the client. */
export function AttentionPanel({
	id,
	title,
	children,
}: {
	id?: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<section
			id={id}
			className="flex scroll-mt-20 flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4"
		>
			<h2 className="flex items-center gap-2 text-sm font-semibold">
				<span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
					<BellRing className="h-3.5 w-3.5" />
					<span className="absolute inset-0 animate-ping rounded-full bg-primary/40 [animation-duration:2.5s]" />
				</span>
				{title}
			</h2>
			<div className="flex flex-col gap-3">{children}</div>
		</section>
	);
}
