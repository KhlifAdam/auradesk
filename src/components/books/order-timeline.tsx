"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type BookStatus, ORDER_STATUSES } from "@/services/books/types";

/** The steps an order goes through after it is sent. */
const STEPS = ORDER_STATUSES;

/** A row of steps from "sent" to "delivered", with the current one marked. */
export function OrderTimeline({ status }: { status: BookStatus }) {
	const t = useTranslations("PhotoBook.status");
	const current = STEPS.indexOf(status as (typeof STEPS)[number]);

	return (
		<ol className="flex items-start gap-1">
			{STEPS.map((step, index) => {
				const done = index < current;
				const active = index === current;
				return (
					<li
						key={step}
						className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center"
					>
						<div className="flex w-full items-center">
							<span
								className={cn(
									"h-px flex-1",
									index === 0
										? "bg-transparent"
										: done || active
											? "bg-primary"
											: "bg-border",
								)}
							/>
							<span
								className={cn(
									"flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
									done && "border-primary bg-primary text-primary-foreground",
									active &&
										"border-primary bg-primary/15 text-primary ring-4 ring-primary/10",
									!done && !active && "border-border text-muted-foreground",
								)}
							>
								{done ? <Check className="h-3.5 w-3.5" /> : index + 1}
							</span>
							<span
								className={cn(
									"h-px flex-1",
									index === STEPS.length - 1
										? "bg-transparent"
										: done
											? "bg-primary"
											: "bg-border",
								)}
							/>
						</div>
						<span
							className={cn(
								"text-[11px] leading-tight",
								active
									? "font-medium text-foreground"
									: "text-muted-foreground",
							)}
						>
							{t(step)}
						</span>
					</li>
				);
			})}
		</ol>
	);
}
