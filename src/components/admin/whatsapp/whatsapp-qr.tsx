import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

const STEPS = ["open", "settings", "link", "scan"] as const;

/** The QR code to scan from the phone, with how to get to the scanner. */
export function WhatsappQr({ qr }: { qr: string | null }) {
	const t = useTranslations("Admin.whatsapp.qr");

	return (
		<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
			<div className="flex size-60 shrink-0 items-center justify-center rounded-xl border border-border bg-white p-2">
				{qr ? (
					<Image src={qr} alt={t("alt")} width={224} height={224} unoptimized />
				) : (
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
				)}
			</div>
			<div className="flex flex-col gap-2 text-sm">
				<p className="font-medium">{t("title")}</p>
				<ol className="flex list-decimal flex-col gap-1 pl-4 text-xs text-muted-foreground">
					{STEPS.map((step) => (
						<li key={step}>{t(`steps.${step}`)}</li>
					))}
				</ol>
				<p className="text-xs text-muted-foreground">{t("refresh")}</p>
			</div>
		</div>
	);
}
