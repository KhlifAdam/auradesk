"use client";

import { motion } from "framer-motion";
import { FileText, Loader2, SendHorizontal, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	attachmentKind,
	formatBytes,
	formatDuration,
} from "@/services/messages/attachments";

/** The file waiting to go with the next message, with upload progress. */
export function StagedFile({
	file,
	progress,
	onRemove,
}: {
	file: File;
	/** Null until sending starts. */
	progress: number | null;
	onRemove: () => void;
}) {
	const t = useTranslations("Messages.composer");
	const isImage = attachmentKind(file.type, false) === "IMAGE";
	const [thumb, setThumb] = useState<string | null>(null);

	useEffect(() => {
		if (!isImage) return;
		const url = URL.createObjectURL(file);
		setThumb(url);
		return () => URL.revokeObjectURL(url);
	}, [file, isImage]);

	return (
		<div className="relative flex items-center gap-2.5 overflow-hidden rounded-lg border border-border bg-muted/50 p-1.5 pr-2">
			<span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-primary">
				{thumb ? (
					<Image
						src={thumb}
						alt=""
						width={36}
						height={36}
						unoptimized
						className="h-full w-full object-cover"
					/>
				) : (
					<FileText className="h-4 w-4" />
				)}
			</span>
			<div className="min-w-0 flex-1">
				<p className="truncate text-xs font-medium">{file.name}</p>
				<p className="text-[11px] text-muted-foreground">
					{progress === null
						? formatBytes(file.size)
						: t("uploading", { percent: progress })}
				</p>
			</div>
			{progress === null ? (
				<button
					type="button"
					onClick={onRemove}
					aria-label={t("removeFile")}
					className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<X className="h-3.5 w-3.5" />
				</button>
			) : (
				<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
			)}
			{progress !== null && (
				<span
					className="absolute bottom-0 left-0 h-0.5 bg-primary transition-[width] duration-200"
					style={{ width: `${progress}%` }}
				/>
			)}
		</div>
	);
}

/** Shown instead of the text box while a voice message is recorded. */
export function RecordingBar({
	elapsed,
	sending,
	onCancel,
	onSend,
}: {
	elapsed: number;
	sending: boolean;
	onCancel: () => void;
	onSend: () => void;
}) {
	const t = useTranslations("Messages.composer");

	return (
		<div className="flex items-center gap-2">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
				onClick={onCancel}
				disabled={sending}
				aria-label={t("cancelRecording")}
			>
				<X className="h-4 w-4" />
			</Button>
			<div className="flex h-9 flex-1 items-center gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 text-sm">
				{sending ? (
					<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
				) : (
					<motion.span
						className="h-2.5 w-2.5 rounded-full bg-destructive"
						animate={{ opacity: [1, 0.3, 1] }}
						transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
					/>
				)}
				<span className="font-medium tabular-nums">
					{formatDuration(elapsed)}
				</span>
				<span className="truncate text-xs text-muted-foreground">
					{t(sending ? "sendingVoice" : "recording")}
				</span>
			</div>
			<Button
				type="button"
				size="icon"
				className="h-9 w-9 shrink-0"
				onClick={onSend}
				disabled={sending}
				aria-label={t("stopAndSend")}
			>
				{sending ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<SendHorizontal className="h-4 w-4" />
				)}
			</Button>
		</div>
	);
}
