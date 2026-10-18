import { getTranslations } from "next-intl/server";
import { AuditList } from "@/components/admin/audit-list";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listAdminActions } from "@/services/admin/audit";
import { pageParamsSchema } from "@/services/shared/pagination";

/** Every admin action on accounts, newest first. */
export default async function AdminActivityPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const t = await getTranslations("Admin.activity");
	await requireAdmin();
	const { page } = pageParamsSchema.parse(await searchParams);
	const log = await listAdminActions(page);

	return (
		<>
			<div className="flex flex-col gap-0.5">
				<h1 className="font-display text-xl font-bold tracking-tight">
					{t("title")}
				</h1>
				<p className="text-xs text-muted-foreground">{t("description")}</p>
			</div>
			<AuditList log={log} />
		</>
	);
}
