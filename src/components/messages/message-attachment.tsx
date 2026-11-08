"use client";

import { Download, FileText, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatBytes, formatDuration } from "@/services/messages/attachments";
import type { ChatAttachment } from "@/services/messages/types";

/** Opens the file under its own name through an access-checked link. */
const downloadHref = (attachment: ChatAttachment) =>
	`/api/messages/attachments/${attachment.id}`;

function VoicePlayer({
	attachment,
	mine,
}: {
	attachment: ChatAttachment;
	mine: boolean;
}) {
	const t = useTranslations("Messages.bubble");
	const audio = useRef<HTMLAudioElement>(null);
	const [playing, setPlaying] = useState(false);
	const [position, setPosition] = useState(0);
	const total = attachment.durationMs ?? 0;

	// Another voice message starting pauses this one.
	useEffect(() => {
		const el = audio.current;
		if (!el) return;
		const onOther = (event: Event) => {
			if (event.target !== el) el.pause();
		};
		document.addEventListener("play", onOther, true);
		return () => document.removeEventListener("play", onOther, true);
	}, []);

	const toggle = () => {
		const el = audio.current;
		if (!el) return;
		if (el.paused) void el.play();
		else el.pause();
	};

	const percent = total > 0 ? Math.min(100, (position / total) * 100) : 0;

	return (
		<div className="flex w-56 max-w-full items-center gap-2.5 py-0.5">
			<button
				type="button"
				onClick={toggle}
				aria-label={t(playing ? "pause" : "play")}
				className={cn(
					"flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
					mine
						? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
						: "bg-primary/15 text-primary hover:bg-primary/25",
				)}
			>
				{playing ? (
					<Pause className="h-3.5 w-3.5" />
				) : (
					<Play className="ml-0.5 h-3.5 w-3.5" />
				)}
			</button>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<input
					type="range"
					min={0}
					max={total || 1}
					value={position}
					aria-label={t("voice")}
					onChange={(event) => {
						const ms = Number(event.target.value);
						if (audio.current) audio.current.currentTime = ms / 1000;
						setPosition(ms);
					}}
					style={{ "--voice-progress": `${percent}%` } as React.CSSProperties}
					className={cn(
						"voice-range h-1 w-full cursor-pointer appearance-none rounded-full",
						mine ? "voice-range-mine" : "voice-range-theirs",
					)}
				/>
				<span className="text-[10px] tabular-nums opacity-70">
					{formatDuration(playing || position > 0 ? position : total)}
				</span>
			</div>
			{/* biome-ignore lint/a11y/useMediaCaption: a spoken message has no captions. */}
			<audio
				ref={audio}
				src={attachment.url}
				preload="metadata"
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
				onEnded={() => {
					setPlaying(false);
					setPosition(0);
				}}
				onTimeUpdate={(event) =>
					setPosition(event.currentTarget.currentTime * 1000)
				}
			/>
		</div>
	);
}

/** What was sent with a message: a photo, a voice message or a file. */
export function MessageAttachment({
	attachment,
	mine,
}: {
	attachment: ChatAttachment;
	mine: boolean;
}) {
	const t = useTranslations("Messages.bubble");

	if (attachment.kind === "VOICE")
		return <VoicePlayer attachment={attachment} mine={mine} />;

	if (attachment.kind === "IMAGE")
		return (
			<a
				href={attachment.url}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={t("openImage")}
				className="-mx-1.5 -mt-0.5 mb-1 block overflow-hidden rounded-xl"
			>
				<Image
					src={attachment.url}
					alt={attachment.filename}
					width={480}
					height={360}
					unoptimized
					className="h-auto max-h-72 w-full max-w-72 object-cover transition-opacity duration-300 hover:opacity-90"
				/>
			</a>
		);

	return (
		<a
			href={downloadHref(attachment)}
			className={cn(
				"-mx-1 mb-1 flex min-w-48 max-w-full items-center gap-2.5 rounded-lg p-2 transition-colors",
				mine
					? "bg-primary-foreground/15 hover:bg-primary-foreground/25"
					: "bg-background/60 hover:bg-background",
			)}
		>
			<span
				className={cn(
					"flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
					mine ? "bg-primary-foreground/20" : "bg-primary/15 text-primary",
				)}
			>
				<FileText className="h-4 w-4" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-xs font-medium">
					{attachment.filename}
				</span>
				<span className="block text-[10px] opacity-70">
					{formatBytes(attachment.size)}
				</span>
			</span>
			<Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
			<span className="sr-only">{t("download")}</span>
		</a>
	);
}
