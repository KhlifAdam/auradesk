"use client";

import { Copy, FileDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { WantedOriginal } from "@/lib/media/collect-originals";

/** "old name,new name" per line, for any tool that renames from a list. */
function renameList(items: WantedOriginal[]) {
	const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
	const ext = (name: string) => name.slice(name.lastIndexOf("."));
	return [
		"original,renamed",
		...items.map((item) =>
			[item.name, `${item.newBase}${ext(item.name)}`].map(quote).join(","),
		),
	].join("\n");
}

/**
 * Browsers without folder access (Firefox, Safari): the chosen names to
 * find in a photo manager, and the renaming plan as a CSV file.
 */
export function CollectFallback({
	items,
	listName,
}: {
	items: WantedOriginal[];
	listName: string;
}) {
	const t = useTranslations("Galleries.collect");

	const copyNames = async () => {
		await navigator.clipboard.writeText(items.map((i) => i.name).join(", "));
		toast.success(t("namesCopied"));
	};

	const download = () => {
		const blob = new Blob([renameList(items)], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const link = Object.assign(document.createElement("a"), {
			href: url,
			download: `${listName}.csv`,
		});
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/50 p-3">
			<p className="text-xs text-muted-foreground">{t("unsupported")}</p>
			<div className="flex flex-wrap gap-2">
				<Button
					size="sm"
					variant="outline"
					className="h-7 gap-1.5 text-xs"
					onClick={copyNames}
				>
					<Copy className="h-3.5 w-3.5" />
					{t("copyNames")}
				</Button>
				<Button
					size="sm"
					variant="outline"
					className="h-7 gap-1.5 text-xs"
					onClick={download}
				>
					<FileDown className="h-3.5 w-3.5" />
					{t("downloadList")}
				</Button>
			</div>
		</div>
	);
}
