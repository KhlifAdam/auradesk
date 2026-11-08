import type { ReactNode } from "react";

/** Title + subtitle shared by every auth screen, with an optional badge and highlights. */
export function AuthHeading({
	title,
	description,
	badge,
	highlights,
}: {
	title: string;
	description: ReactNode;
	badge?: ReactNode;
	/** Short "what you get" line under the description. */
	highlights?: string;
}) {
	return (
		<div className="flex flex-col items-center space-y-1.5 text-center">
			{badge}
			<h1 className="text-3xl font-semibold tracking-tight text-foreground">
				{title}
			</h1>
			<p className="text-sm text-muted-foreground">{description}</p>
			{highlights && (
				<p className="text-xs font-medium tracking-wide text-primary/80">
					{highlights}
				</p>
			)}
		</div>
	);
}
