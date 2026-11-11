"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** "1 The request, 2 The quote": where the form is, and a way back. */
export function BookingSteps({
	step,
	onStep,
}: {
	step: 1 | 2;
	onStep: (step: 1 | 2) => void;
}) {
	const t = useTranslations("Bookings.form.steps");

	return (
		<ol className="flex items-center gap-2 text-xs">
			{([1, 2] as const).map((value) => (
				<li key={value} className="flex items-center gap-2">
					{value === 2 && <span className="h-px w-8 bg-border" />}
					<button
						type="button"
						onClick={() => onStep(value)}
						className={cn(
							"flex items-center gap-2 rounded-full border px-3 py-1 font-medium transition-colors duration-200",
							step === value
								? "border-primary bg-primary/10 text-primary"
								: "border-border text-muted-foreground hover:text-foreground",
						)}
					>
						<span
							className={cn(
								"flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
								step === value
									? "bg-primary text-primary-foreground"
									: "bg-muted",
							)}
						>
							{value}
						</span>
						{t(value === 1 ? "request" : "quote")}
					</button>
				</li>
			))}
		</ol>
	);
}
