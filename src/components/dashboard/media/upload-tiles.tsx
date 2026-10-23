"use client";

import { AlertCircle, Check, FileVideo, RotateCcw, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { UploadTask } from "@/hooks/use-upload-queue";
import { cn } from "@/lib/utils";

/** Errors that a retry can't fix. */
const FINAL_ERRORS = new Set([
	"unsupportedType",
	"tooLarge",
	"uploadCancelled",
]);

/** A local preview of the file being sent (photos only). */
function usePreview(file: File) {
	const [url, setUrl] = useState<string | null>(null);
	useEffect(() => {
		if (!file.type.startsWith("image/")) return;
		const objectUrl = URL.createObjectURL(file);
		setUrl(objectUrl);
		return () => URL.revokeObjectURL(objectUrl);
	}, [file]);
	return url;
}

/** Circular progress, 0–100. */
function ProgressRing({ value }: { value: number }) {
	const radius = 16;
	const length = 2 * Math.PI * radius;
	return (
		<div className="relative flex h-11 w-11 items-center justify-center">
			<svg
				viewBox="0 0 40 40"
				aria-hidden="true"
				className="absolute inset-0 -rotate-90"
			>
				<circle
					cx="20"
					cy="20"
					r={radius}
					fill="none"
					strokeWidth="3"
					className="stroke-background/60"
				/>
				<circle
					cx="20"
					cy="20"
					r={radius}
					fill="none"
					strokeWidth="3"
					strokeLinecap="round"
					strokeDasharray={length}
					strokeDashoffset={length * (1 - value / 100)}
					className="stroke-primary transition-[stroke-dashoffset] duration-300"
				/>
			</svg>
			<span className="text-[10px] font-semibold tabular-nums text-foreground">
				{Math.round(value)}%
			</span>
		</div>
	);
}

function UploadTile({
	task,
	onRetry,
	onCancel,
}: {
	task: UploadTask;
	onRetry: (id: string) => void;
	onCancel?: (id: string) => void;
}) {
	const t = useTranslations("Media.queue");
	const errorMessage = useErrorMessage();
	const preview = usePreview(task.file);
	const done = task.status === "done";
	const failed = task.status === "error";
	const active = task.status === "queued" || task.status === "uploading";

	return (
		<div
			className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
			title={failed ? errorMessage(task.error) : task.file.name}
		>
			{preview ? (
				<Image
					src={preview}
					alt=""
					fill
					unoptimized
					className={cn(
						"object-cover transition-all duration-500",
						!done && "scale-105 opacity-40 blur-[2px]",
					)}
				/>
			) : (
				<FileVideo className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
			)}

			<div className="absolute inset-0 flex items-center justify-center">
				{active && <ProgressRing value={task.progress} />}
				{done && (
					<span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow animate-in zoom-in-50 duration-300">
						<Check className="h-3 w-3" />
					</span>
				)}
				{failed && (
					<div className="flex flex-col items-center gap-1.5 px-2 text-center">
						<AlertCircle className="h-5 w-5 text-destructive" />
						<span className="line-clamp-2 text-[10px] font-medium text-destructive">
							{errorMessage(task.error)}
						</span>
						{!FINAL_ERRORS.has(task.error ?? "") && (
							<button
								type="button"
								onClick={() => onRetry(task.id)}
								className="flex items-center gap-1 rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-medium backdrop-blur transition-colors hover:bg-background"
							>
								<RotateCcw className="h-3 w-3" />
								{t("retry")}
							</button>
						)}
					</div>
				)}
			</div>

			{active && onCancel && (
				<button
					type="button"
					onClick={() => onCancel(task.id)}
					aria-label={t("cancel")}
					className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 opacity-0 backdrop-blur transition-opacity duration-200 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
				>
					<X className="h-3 w-3" />
				</button>
			)}
		</div>
	);
}

/**
 * Files being sent, as tiles: a faded preview with a progress ring that
 * sharpens into the photo once it has landed.
 */
export function UploadTiles({
	tasks,
	onRetry,
	onClear,
	onCancel,
	className,
}: {
	tasks: UploadTask[];
	onRetry: (id: string) => void;
	onClear: () => void;
	onCancel?: (id: string) => void;
	/** The grid's columns, to match the photos around it. */
	className?: string;
}) {
	const t = useTranslations("Media.queue");
	if (tasks.length === 0) return null;
	const doneCount = tasks.filter((task) => task.status === "done").length;

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				<p className="text-xs text-muted-foreground">
					{t("summary", { done: doneCount, total: tasks.length })}
				</p>
				{doneCount > 0 && (
					<button
						type="button"
						onClick={onClear}
						className="text-xs text-muted-foreground transition-colors hover:text-foreground"
					>
						{t("clear")}
					</button>
				)}
			</div>
			<div
				className={cn(
					"grid grid-cols-3 gap-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8",
					className,
				)}
			>
				{tasks.map((task) => (
					<UploadTile
						key={task.id}
						task={task}
						onRetry={onRetry}
						onCancel={onCancel}
					/>
				))}
			</div>
		</div>
	);
}
