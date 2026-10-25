"use client";

import { useTranslations } from "next-intl";

/** One option with its control and what it adds to the price. */
export function Choice({
	id,
	name,
	price,
	children,
}: {
	id: string;
	name: string;
	price: number;
	children: React.ReactNode;
}) {
	const t = useTranslations("PhotoBook.order");
	return (
		<div className="flex items-center gap-2.5">
			{children}
			<label
				htmlFor={id}
				className="flex flex-1 cursor-pointer justify-between gap-3 text-sm"
			>
				<span>{name}</span>
				<span className="text-muted-foreground tabular-nums">
					{price > 0 ? t("adds", { price }) : t("included")}
				</span>
			</label>
		</div>
	);
}
