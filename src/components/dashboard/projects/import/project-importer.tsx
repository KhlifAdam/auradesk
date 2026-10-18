"use client";

import { ArrowRight, FolderOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useGalleryUpload } from "@/components/dashboard/galleries/use-gallery-upload";
import { MediaDropzone } from "@/components/dashboard/media/media-dropzone";
import { UploadQueue } from "@/components/dashboard/media/upload-queue";
import { Button } from "@/components/ui/button";
import {
	GALLERY_IMAGE_TYPES,
	GALLERY_MIME_TYPES,
	isGalleryMime,
	isProofMime,
} from "@/services/galleries/constants";
import type { GalleryKind } from "@/services/galleries/types";
import type { InterruptedUpload } from "@/services/galleries/upload-queries";
import { GalleryPicker } from "./gallery-picker";
import { InterruptedUploads } from "./interrupted-uploads";

interface ProjectImporterProps {
	projectId: string;
	galleries: {
		id: string;
		title: string;
		kind: GalleryKind;
		itemCount: number;
	}[];
	galleryId: string | null;
	interrupted: InterruptedUpload[];
}

/** Choose a gallery, drop files or a whole folder, follow each upload. */
export function ProjectImporter({
	projectId,
	galleries,
	galleryId,
	interrupted,
}: ProjectImporterProps) {
	const t = useTranslations("Projects.import");
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const folderInput = useRef<HTMLInputElement>(null);
	const fileInput = useRef<HTMLInputElement>(null);

	const refresh = useCallback(() => router.refresh(), [router]);
	const kind = galleries.find((g) => g.id === galleryId)?.kind ?? "FINAL";
	const { tasks, addFiles, retry, cancel, clearFinished, isUploading } =
		useGalleryUpload(galleryId, refresh, kind);

	const selectGallery = useCallback(
		(id: string) => {
			const params = new URLSearchParams(searchParams);
			params.set("gallery", id);
			router.replace(`${pathname}?${params}`, { scroll: false });
		},
		[pathname, router, searchParams],
	);

	const accepts = kind === "PROOFS" ? isProofMime : isGalleryMime;
	const accept = kind === "PROOFS" ? GALLERY_IMAGE_TYPES : GALLERY_MIME_TYPES;

	// A folder holds more than photos and videos (RAW files, sidecars): keep
	// what the gallery takes, say what was left.
	const addFolder = (files: File[]) => {
		const media = files.filter((file) => accepts(file.type));
		const skipped = files.length - media.length;
		if (skipped > 0) toast.info(t("skipped", { count: skipped }));
		if (media.length > 0) addFiles(media);
	};

	// Folder picking has no React prop: the attribute is set by hand.
	useEffect(() => {
		folderInput.current?.setAttribute("webkitdirectory", "");
	}, []);

	// Closing the tab mid-upload loses the part in flight: ask first.
	useEffect(() => {
		if (!isUploading) return;
		const warn = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [isUploading]);

	const finished = tasks.filter((task) => task.status === "done").length;
	// The gallery's own count (refreshed after each upload) keeps the link
	// once the finished uploads are cleared from the list.
	const hasFiles =
		finished > 0 ||
		(galleries.find((g) => g.id === galleryId)?.itemCount ?? 0) > 0;

	return (
		<div className="flex max-w-4xl flex-col gap-4">
			<InterruptedUploads
				uploads={interrupted}
				disabled={isUploading}
				onResume={(id) => {
					selectGallery(id);
					fileInput.current?.click();
				}}
			/>
			<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
				<div className="flex flex-col gap-1">
					<h2 className="text-sm font-semibold">{t("galleryTitle")}</h2>
					<p className="text-xs text-muted-foreground">{t("galleryHint")}</p>
				</div>
				<GalleryPicker
					projectId={projectId}
					galleries={galleries}
					value={galleryId}
					onChange={selectGallery}
					disabled={isUploading}
				/>
			</section>
			{galleryId && (
				<section className="flex flex-col gap-3">
					<div className="flex flex-col gap-2 sm:flex-row">
						<MediaDropzone
							onFiles={addFiles}
							accept={accept}
							hint={t(kind === "PROOFS" ? "dropHintProofs" : "dropHint")}
							className="flex-1"
						/>
						<Button
							type="button"
							variant="outline"
							className="h-auto gap-2 text-xs sm:w-44"
							onClick={() => folderInput.current?.click()}
						>
							<FolderOpen className="h-4 w-4" />
							{t("chooseFolder")}
						</Button>
					</div>
					<input
						ref={folderInput}
						type="file"
						multiple
						hidden
						onChange={(event) => {
							if (event.target.files) addFolder(Array.from(event.target.files));
							event.target.value = "";
						}}
					/>
					<input
						ref={fileInput}
						type="file"
						hidden
						accept={accept.join(",")}
						onChange={(event) => {
							if (event.target.files) addFiles(Array.from(event.target.files));
							event.target.value = "";
						}}
					/>
					<UploadQueue
						tasks={tasks}
						onRetry={retry}
						onCancel={cancel}
						onClear={clearFinished}
					/>
					{hasFiles && !isUploading && (
						<Button asChild size="sm" className="w-fit gap-1.5 text-xs">
							<Link
								href={`/dashboard/projects/${projectId}/galleries/${galleryId}`}
							>
								{t("openGallery")}
								<ArrowRight className="h-3.5 w-3.5" />
							</Link>
						</Button>
					)}
				</section>
			)}
		</div>
	);
}
