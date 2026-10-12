import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { InvoiceForm } from "@/components/dashboard/invoices/form/invoice-form";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { emptyInvoiceValues } from "@/services/invoices/form-values";
import { invoicePrefillFromProject } from "@/services/invoices/prefill";

interface NewInvoicePageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewInvoicePage({
	searchParams,
}: NewInvoicePageProps) {
	const t = await getTranslations("Invoices.form");
	const { photographerId } = await requirePhotographer();
	const { project: projectId } = await searchParams;

	// Coming from a project: bill its client at its price.
	const prefill =
		typeof projectId === "string"
			? await invoicePrefillFromProject(photographerId, projectId)
			: null;
	const backHref = prefill
		? `/dashboard/projects/${projectId}`
		: "/dashboard/invoices";

	return (
		<PageShell>
			<Link
				href={backHref}
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("back")}
			</Link>
			<PageHeader title={t("createTitle")} description={t("description")} />
			<InvoiceForm
				initial={emptyInvoiceValues(prefill?.values)}
				projectTitle={prefill?.projectTitle ?? null}
				backHref={backHref}
			/>
		</PageShell>
	);
}
