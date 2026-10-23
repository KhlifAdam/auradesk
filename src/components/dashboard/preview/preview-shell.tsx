"use client";

import { ArrowLeft, Check, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SegmentedControl } from "@/components/dashboard/shared/segmented-control";
import { LiveSitePreview } from "@/components/dashboard/website/appearance/live-site-preview";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { SITE_TEMPLATE_IDS } from "@/lib/public-site/design";
import {
	type PreviewData,
	type PreviewParams,
	previewQuery,
} from "@/services/preview/preview-params";
import { updateSiteDesign } from "@/services/studio/actions";
import { type SiteDesign, THEME_MODES } from "@/services/studio/schemas";
import { DeviceSwitch } from "./device-switch";
import type { Device } from "./devices";

interface PreviewShellProps {
	/** What the page was opened with (language, unsaved sections, screen…). */
	params: PreviewParams;
	initialData: PreviewData;
	design: SiteDesign;
	savedDesign: SiteDesign | null;
	hasStudio: boolean;
	hasContent: boolean;
}

/** Toolbar + iframe: pick a template, real vs demo content, and device width. */
export function PreviewShell({
	params,
	initialData,
	design,
	savedDesign,
	hasStudio,
	hasContent,
}: PreviewShellProps) {
	const t = useTranslations("Preview");
	const tTemplates = useTranslations("Site.appearance.template.options");
	const tModes = useTranslations("Site.appearance.themeMode.options");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [data, setData] = useState<PreviewData>(initialData);
	const [template, setTemplate] = useState(design.template);
	const [themeMode, setThemeMode] = useState(design.themeMode);
	const [device, setDevice] = useState<Device>(params.device ?? "desktop");
	const [saved, setSaved] = useState(savedDesign);
	const [isApplying, startTransition] = useTransition();

	const current: SiteDesign = { ...design, template, themeMode };
	const isApplied =
		saved?.template === template &&
		saved.accentColor === design.accentColor &&
		saved.fontPair === design.fontPair &&
		saved.themeMode === themeMode;
	const src = `/preview/frame?${previewQuery({
		data,
		template,
		accent: design.accentColor,
		font: design.fontPair,
		mode: themeMode,
		lang: params.lang,
		draft: params.draft,
	})}`;

	const apply = () =>
		startTransition(async () => {
			const result = await updateSiteDesign(current);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			setSaved(current);
			toast.success(t("applied"));
			router.refresh();
		});

	const showEmptyNote = data === "mine" && !hasContent;

	return (
		<div className="flex h-screen flex-col bg-background">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="h-7 gap-1.5 text-xs"
				>
					<Link href="/dashboard/site/appearance">
						<ArrowLeft className="h-3.5 w-3.5" />
						{t("back")}
					</Link>
				</Button>

				<div className="flex flex-wrap items-center gap-3">
					<SegmentedControl
						value={template}
						onChange={setTemplate}
						options={SITE_TEMPLATE_IDS.map((id) => ({
							value: id,
							label: tTemplates(`${id}.name`),
						}))}
					/>
					<SegmentedControl
						value={themeMode}
						onChange={setThemeMode}
						options={THEME_MODES.map((mode) => ({
							value: mode,
							label: tModes(mode),
						}))}
					/>
					<SegmentedControl
						value={data}
						onChange={setData}
						options={[
							{ value: "mine", label: t("mine") },
							{ value: "demo", label: t("demo") },
						]}
					/>
					<DeviceSwitch value={device} onChange={setDevice} />
				</div>

				<Button
					size="sm"
					className="h-7 gap-1.5 text-xs"
					onClick={apply}
					disabled={!hasStudio || isApplied || isApplying}
				>
					{isApplying ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						isApplied && <Check className="h-3.5 w-3.5" />
					)}
					{isApplied ? t("inUse") : t("apply")}
				</Button>
			</div>

			{(data === "demo" || showEmptyNote) && (
				<div className="flex items-center gap-2 border-b border-border bg-primary/5 px-4 py-1.5 text-xs text-muted-foreground">
					<Info className="h-3.5 w-3.5 shrink-0 text-primary" />
					{showEmptyNote
						? t("emptyNote")
						: hasContent
							? t("demoNote")
							: t("demoNoContent")}
				</div>
			)}

			<div className="min-h-0 flex-1 p-3">
				<LiveSitePreview
					src={src}
					device={device}
					focus={params.focus}
					interactive
					className="h-full"
				/>
			</div>
		</div>
	);
}
