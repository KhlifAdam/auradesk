import { Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { InvoiceList } from "@/components/dashboard/invoices/invoice-list";
import { Button } from "@/components/ui/button";
import type { InvoiceSummary } from "@/services/invoices/types";

/**
 * A project's invoices. The dashboard can add one from here; the portal
 * shows only the issued ones and hides the section when there are none.
 */
export async function InvoiceSection({
	invoices,
	hrefBase,
	newHref,
}: {
	invoices: InvoiceSummary[];
	hrefBase: string;
	/** Dashboard only: where "New invoice" goes. */
	newHref?: string;
}) {
	const t = await getTranslations("Invoices.section");
	if (invoices.length === 0 && !newHref) return null;

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				{newHref && (
					<Button
						asChild
						size="sm"
						variant="outline"
						className="h-7 gap-1.5 text-xs"
					>
						<Link href={newHref}>
							<Plus className="h-3.5 w-3.5" />
							{t("new")}
						</Link>
					</Button>
				)}
			</div>
			{invoices.length === 0 ? (
				<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<Receipt className="h-3.5 w-3.5" />
					{t("none")}
				</p>
			) : (
				<InvoiceList invoices={invoices} hrefBase={hrefBase} />
			)}
		</section>
	);
}
