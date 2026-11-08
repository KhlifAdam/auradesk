import { getLocale, getTranslations } from "next-intl/server";
import { amountRemaining, formatMoney } from "@/services/projects/money";
import type { ProjectDetail } from "@/services/projects/types";
import { ProjectPaymentControl } from "./project-payment-control";

export async function ProjectFinanceCard({
	project,
}: {
	project: ProjectDetail;
}) {
	const t = await getTranslations("Projects.facts");
	const locale = await getLocale();
	const remaining = amountRemaining(
		project.price,
		project.advance,
		project.discount,
	);
	const hasDiscount = project.discount > 0;
	const money = (value: number | null) =>
		value === null ? "—" : formatMoney(value, locale);

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
			<div className="flex items-center justify-between gap-2">
				<h2 className="text-xs font-medium text-muted-foreground">
					{t("finance")}
				</h2>
				<ProjectPaymentControl
					projectId={project.id}
					status={project.paymentStatus}
				/>
			</div>
			<dl
				className={`grid gap-3 ${hasDiscount ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}
			>
				{[
					[t("price"), money(project.price)],
					...(hasDiscount
						? [[t("discount"), `− ${money(project.discount)}`]]
						: []),
					[t("advance"), money(project.advance)],
					[t("remaining"), money(remaining)],
				].map(([label, value]) => (
					<div key={label} className="flex flex-col gap-0.5">
						<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
							{label}
						</dt>
						<dd className="text-sm font-semibold">{value}</dd>
					</div>
				))}
			</dl>
			{project.financialNotes && (
				<p className="whitespace-pre-wrap text-xs text-muted-foreground">
					{project.financialNotes}
				</p>
			)}
		</section>
	);
}
