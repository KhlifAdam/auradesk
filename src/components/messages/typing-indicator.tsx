import { useTranslations } from "next-intl";

/** Three softly pulsing dots in a partner-style bubble. */
export function TypingBubble() {
	const t = useTranslations("Messages.thread");
	return (
		<div className="flex justify-start" role="status" aria-label={t("typing")}>
			<div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-3 py-2.5">
				{[0, 1, 2].map((dot) => (
					<span
						key={dot}
						className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground"
						style={{ animationDelay: `${dot * 200}ms` }}
					/>
				))}
			</div>
		</div>
	);
}
