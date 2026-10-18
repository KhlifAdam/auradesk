import { getTranslations } from "next-intl/server";
import { AccountDataCard } from "@/components/account/account-data-card";
import { PrivacySettingsForm } from "@/components/dashboard/privacy/privacy-settings-form";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { RETENTION_CHOICES } from "@/services/privacy/schemas";

/** Retention, location data, and the studio's own GDPR rights. */
export default async function PrivacyPage() {
	const t = await getTranslations("Privacy");
	const { photographerId } = await requirePhotographer();
	const studio = await db.studio.findUnique({
		where: { photographerId },
		select: { galleryRetentionMonths: true, stripGalleryLocation: true },
	});
	const values = studio && {
		retention:
			RETENTION_CHOICES.find(
				(months) => months === String(studio.galleryRetentionMonths ?? ""),
			) ?? "",
		stripLocation: studio.stripGalleryLocation,
	};

	return (
		<PageShell>
			<PageHeader title={t("title")} description={t("description")} />
			<div className="flex max-w-2xl flex-col gap-3">
				{values ? (
					<PrivacySettingsForm values={values} />
				) : (
					<p className="text-xs text-muted-foreground">{t("noStudio")}</p>
				)}
				<AccountDataCard studio />
			</div>
		</PageShell>
	);
}
