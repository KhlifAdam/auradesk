"use client";

import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/** Opens the browser's print dialog, which can also save the page as PDF. */
export function PrintButton() {
	const t = useTranslations("Invoices.detail");

	return (
		<Button
			type="button"
			size="sm"
			variant="outline"
			className="h-7 gap-1.5 text-xs"
			onClick={() => window.print()}
		>
			<Printer className="h-3.5 w-3.5" />
			{t("print")}
		</Button>
	);
}
