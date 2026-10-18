"use client";

import { FolderDown, FolderOpen, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	type CollectReport,
	canCollectOriginals,
	collectOriginals,
} from "@/lib/media/collect-originals";
import type { PickToCollect } from "@/services/galleries/collect-queries";
import { organizedName, prefixSchema } from "@/services/galleries/organize";
import { CollectFallback } from "./collect-fallback";

/**
 * First step of post-production: the chosen photos' originals (and their RAW
 * twins) copied from the shoot folder into one folder, renamed in shooting
 * order. Runs in the browser, on the photographer's own disk.
 */
export function CollectOriginalsDialog({
	picks,
	defaultPrefix,
}: {
	picks: PickToCollect[];
	defaultPrefix: string;
}) {
	const t = useTranslations("Galleries.collect");
	const [prefix, setPrefix] = useState(defaultPrefix);
	const [done, setDone] = useState<number | null>(null);
	const [report, setReport] = useState<CollectReport | null>(null);
	const validPrefix = prefixSchema.safeParse(prefix);
	const folderName = `${prefix} - selection`;

	const wanted = useMemo(
		() =>
			picks.map((pick, index) => ({
				name: pick.name,
				size: pick.size,
				modifiedAt: pick.modifiedAt,
				newBase: organizedName(prefix, new Date(pick.takenAt), index, ""),
			})),
		[picks, prefix],
	);

	async function run() {
		if (!window.showDirectoryPicker) return;
		let source: FileSystemDirectoryHandle;
		try {
			source = await window.showDirectoryPicker({ mode: "readwrite" });
		} catch {
			return; // The folder picker was closed.
		}
		setReport(null);
		setDone(0);
		try {
			const result = await collectOriginals(
				source,
				wanted,
				folderName,
				setDone,
			);
			setReport(result);
			toast.success(t("finished", { count: result.copied }));
		} catch {
			toast.error(t("failed"));
		} finally {
			setDone(null);
		}
	}

	const running = done !== null;

	return (
		<Dialog onOpenChange={() => setReport(null)}>
			<DialogTrigger asChild>
				<Button size="sm" className="h-8 gap-1.5 text-xs">
					<FolderDown className="h-3.5 w-3.5" />
					{t("button", { count: picks.length })}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>
						{t("description", { count: picks.length })}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1">
						<Label htmlFor="collect-prefix" className="text-xs">
							{t("prefix")}
						</Label>
						<Input
							id="collect-prefix"
							value={prefix}
							disabled={running}
							onChange={(event) => setPrefix(event.target.value)}
							className="h-8 text-sm"
						/>
						<p className="text-[11px] text-muted-foreground">
							{validPrefix.success && wanted[0]
								? t("example", { name: wanted[0].newBase, folder: folderName })
								: t("invalidPrefix")}
						</p>
					</div>
					{canCollectOriginals() ? (
						<Button
							size="sm"
							className="h-8 w-fit gap-1.5 text-xs"
							disabled={running || !validPrefix.success || picks.length === 0}
							onClick={run}
						>
							{running ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<FolderOpen className="h-3.5 w-3.5" />
							)}
							{t("chooseFolder")}
						</Button>
					) : (
						<CollectFallback items={wanted} listName={folderName} />
					)}
					{running && (
						<Progress
							value={(done / Math.max(1, picks.length)) * 100}
							className="h-1.5"
						/>
					)}
					{report && (
						<div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/50 p-3 text-xs">
							<p className="font-medium">
								{t("report", { copied: report.copied, twins: report.twins })}
							</p>
							{report.missing.length > 0 && (
								<p className="text-muted-foreground">
									{t("missing", {
										count: report.missing.length,
										names: report.missing.slice(0, 8).join(", "),
									})}
								</p>
							)}
						</div>
					)}
					<p className="text-[11px] text-muted-foreground">{t("privacy")}</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
