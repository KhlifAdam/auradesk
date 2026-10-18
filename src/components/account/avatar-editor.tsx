"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { initialsOf } from "@/lib/initials";
import { makeImagePreview } from "@/lib/media/make-preview";
import { putWithProgress } from "@/lib/media/read-media-metadata";
import {
	removeAvatar,
	saveAvatar,
	startAvatarUpload,
} from "@/services/account/actions";
import { AVATAR_EDGE } from "@/services/account/schemas";

/**
 * The profile photo: the browser shrinks the chosen picture to a small JPEG
 * (no location or other metadata left) before sending it.
 */
export function AvatarEditor({
	name,
	image,
}: {
	name: string;
	image: string | null;
}) {
	const t = useTranslations("Account.profile");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const input = useRef<HTMLInputElement>(null);
	const [isPending, startTransition] = useTransition();

	const upload = (file: File) =>
		startTransition(async () => {
			try {
				const { blob } = await makeImagePreview(file, AVATAR_EDGE);
				const started = await startAvatarUpload({ size: blob.size });
				if (!started.ok) throw new Error(started.error);
				await putWithProgress(started.data.uploadUrl, blob, () => {});
				const saved = await saveAvatar({ key: started.data.key });
				if (!saved.ok) throw new Error(saved.error);
				toast.success(t("photoSaved"));
				router.refresh();
			} catch (error) {
				toast.error(errorMessage((error as Error).message || "uploadFailed"));
			}
		});

	const remove = () =>
		startTransition(async () => {
			const result = await removeAvatar();
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("photoRemoved"));
			router.refresh();
		});

	return (
		<section className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
			<Avatar className="h-16 w-16 border border-border">
				<AvatarImage
					src={image ?? undefined}
					alt={name}
					className="object-cover"
				/>
				<AvatarFallback className="bg-primary/10 text-lg text-primary">
					{initialsOf(name)}
				</AvatarFallback>
			</Avatar>
			<div className="flex flex-col gap-2">
				<div>
					<p className="text-sm font-medium">{t("photo")}</p>
					<p className="text-xs text-muted-foreground">{t("photoHint")}</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						size="sm"
						variant="outline"
						className="h-7 gap-1.5 text-xs"
						disabled={isPending}
						onClick={() => input.current?.click()}
					>
						{isPending ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Camera className="h-3.5 w-3.5" />
						)}
						{t(image ? "changePhoto" : "addPhoto")}
					</Button>
					{image && (
						<Button
							size="sm"
							variant="ghost"
							className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
							disabled={isPending}
							onClick={remove}
						>
							<Trash2 className="h-3.5 w-3.5" />
							{t("removePhoto")}
						</Button>
					)}
				</div>
			</div>
			<input
				ref={input}
				type="file"
				accept="image/jpeg,image/png,image/webp"
				hidden
				onChange={(event) => {
					const file = event.target.files?.[0];
					if (file) upload(file);
					event.target.value = "";
				}}
			/>
		</section>
	);
}
