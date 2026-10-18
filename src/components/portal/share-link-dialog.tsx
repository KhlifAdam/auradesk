"use client";

import { Check, Copy, Link2, Loader2, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useErrorMessage } from "@/hooks/use-error-message";
import { SHARE_EXPIRY_DAYS } from "@/services/galleries/schemas";
import {
	saveShareLink,
	stopShareLink,
} from "@/services/galleries/share-actions";
import type { GalleryShare } from "@/services/galleries/types";

type Expiry = (typeof SHARE_EXPIRY_DAYS)[number];

/**
 * "Anyone with the link can view": the client shares one gallery with people
 * who have no account. Downloads are offered once the files are theirs.
 */
export function ShareLinkDialog({
	galleryId,
	share,
	downloadsPossible,
}: {
	galleryId: string;
	share: GalleryShare | null;
	/** Delivered and paid finals: link visitors could download them. */
	downloadsPossible: boolean;
}) {
	const t = useTranslations("Portal.share");
	const format = useFormatter();
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [downloads, setDownloads] = useState(share?.downloads ?? false);
	const [expiry, setExpiry] = useState<Expiry>(0);
	const [copied, setCopied] = useState(false);
	const [origin, setOrigin] = useState("");
	const [isPending, startTransition] = useTransition();
	useEffect(() => setOrigin(window.location.origin), []);

	const url = share ? `${origin}/g/${share.token}` : "";

	const save = () =>
		startTransition(async () => {
			const result = await saveShareLink({
				galleryId,
				downloads: downloadsPossible && downloads,
				expiresInDays: expiry,
			});
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t(share ? "updated" : "created"));
			router.refresh();
		});

	const stop = () =>
		startTransition(async () => {
			const result = await stopShareLink(galleryId);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("stopped"));
			router.refresh();
		});

	const copy = async () => {
		await navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
					<Link2 className="h-3.5 w-3.5" />
					{share ? t("buttonActive") : t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					{share && (
						<div className="flex flex-col gap-1">
							<div className="flex gap-2">
								<Input readOnly value={url} className="h-8 text-xs" />
								<Button
									size="sm"
									className="h-8 gap-1.5 text-xs"
									onClick={copy}
								>
									{copied ? (
										<Check className="h-3.5 w-3.5" />
									) : (
										<Copy className="h-3.5 w-3.5" />
									)}
									{t(copied ? "copied" : "copy")}
								</Button>
							</div>
							<p className="text-[11px] text-muted-foreground">
								{share.expiresAt
									? t("expiresOn", {
											date: format.dateTime(new Date(share.expiresAt), {
												dateStyle: "long",
											}),
										})
									: t("noExpiry")}
							</p>
						</div>
					)}
					<div className="flex flex-col gap-1">
						<Label className="text-xs">{t("expiry")}</Label>
						<Select
							value={String(expiry)}
							onValueChange={(value) => setExpiry(Number(value) as Expiry)}
						>
							<SelectTrigger className="h-8 w-48 text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{SHARE_EXPIRY_DAYS.map((days) => (
									<SelectItem
										key={days}
										value={String(days)}
										className="text-sm"
									>
										{t("days", { count: days })}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{downloadsPossible && (
						<div className="flex items-center justify-between gap-3">
							<Label htmlFor="share-downloads" className="text-xs font-normal">
								{t("downloads")}
							</Label>
							<Switch
								id="share-downloads"
								checked={downloads}
								onCheckedChange={setDownloads}
							/>
						</div>
					)}
					<p className="text-[11px] text-muted-foreground">
						{t(downloadsPossible ? "viewNote" : "previewNote")}
					</p>
					<div className="flex flex-wrap items-center justify-between gap-2">
						{share ? (
							<Button
								size="sm"
								variant="ghost"
								className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
								disabled={isPending}
								onClick={stop}
							>
								<Unlink className="h-3.5 w-3.5" />
								{t("stop")}
							</Button>
						) : (
							<span />
						)}
						<Button
							size="sm"
							className="h-8 gap-1.5 text-xs"
							disabled={isPending}
							onClick={save}
						>
							{isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
							{t(share ? "save" : "create")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
