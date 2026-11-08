"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Check,
	Loader2,
	Mic,
	Paperclip,
	Pencil,
	SendHorizontal,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useErrorMessage } from "@/hooks/use-error-message";
import {
	ATTACHMENT_ACCEPT,
	type SentAttachment,
} from "@/services/messages/attachments";
import { MESSAGE_MAX_LENGTH } from "@/services/messages/constants";
import {
	type ComposerValues,
	composerSchema,
} from "@/services/messages/schemas";
import type { MessageRole } from "@/services/messages/viewer";
import { RecordingBar, StagedFile } from "./composer-extras";
import { useComposerMedia } from "./use-composer-media";

interface MessageComposerProps {
	role: MessageRole;
	/** Resolves to an error code, or null once sent. */
	onSend: (
		body: string,
		attachment: SentAttachment | null,
	) => Promise<string | null>;
	/** Called on every keystroke, to tell the partner someone is typing. */
	onTyping?: () => void;
	/** The message being edited: the text moves into the box until saved. */
	editing?: { id: string; body: string } | null;
	onCancelEdit?: () => void;
}

/**
 * Enter sends, Shift+Enter adds a line. A file can go along with the text;
 * with an empty box, the microphone records a voice message instead.
 */
export function MessageComposer({
	role,
	onSend,
	onTyping,
	editing,
	onCancelEdit,
}: MessageComposerProps) {
	const t = useTranslations("Messages.composer");
	const errorMessage = useErrorMessage();
	const form = useForm<ComposerValues>({
		resolver: zodResolver(composerSchema),
		defaultValues: { body: "" },
	});
	const { isSubmitting } = form.formState;
	const body = useWatch({ control: form.control, name: "body" });
	const editingId = editing?.id;
	const editingBody = editing?.body;
	const picker = useRef<HTMLInputElement>(null);
	const media = useComposerMedia(role, onSend);
	const { file, recorder } = media;

	// Opening an edit loads its text; leaving it empties the box again.
	useEffect(() => {
		form.reset({ body: editingBody ?? "" });
		if (editingId) form.setFocus("body");
	}, [editingId, editingBody, form]);

	async function onSubmit({ body: text }: ComposerValues) {
		if (editing) {
			const error = await onSend(text, null);
			if (error) return void toast.error(errorMessage(error));
			return form.reset({ body: "" });
		}
		if (!text && !file) return;
		if (await media.sendWithFile(text)) form.reset({ body: "" });
	}

	function pick(picked: File | undefined) {
		if (media.pick(picked)) form.setFocus("body");
	}

	const showMic = !editing && !file && !body?.trim();

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-2 border-t border-border p-3"
			>
				{editing && (
					<div className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs">
						<Pencil className="h-3.5 w-3.5 shrink-0 text-primary" />
						<span className="min-w-0 flex-1 truncate text-muted-foreground">
							{t("editing")}
						</span>
						<button
							type="button"
							onClick={onCancelEdit}
							className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
							aria-label={t("cancelEdit")}
						>
							<X className="h-3.5 w-3.5" />
						</button>
					</div>
				)}
				{file && !editing && (
					<StagedFile
						file={file}
						progress={media.progress}
						onRemove={media.removeFile}
					/>
				)}
				{media.recording ? (
					<RecordingBar
						elapsed={recorder.elapsed}
						sending={media.voiceSending}
						onCancel={recorder.cancel}
						onSend={media.stopAndSend}
					/>
				) : (
					<div className="flex items-end gap-1.5">
						{!editing && (
							<>
								<input
									ref={picker}
									type="file"
									accept={ATTACHMENT_ACCEPT}
									className="hidden"
									onChange={(event) => {
										pick(event.target.files?.[0]);
										event.target.value = "";
									}}
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
									disabled={isSubmitting}
									onClick={() => picker.current?.click()}
									aria-label={t("attach")}
									title={t("attach")}
								>
									<Paperclip className="h-4 w-4" />
								</Button>
							</>
						)}
						<FormField
							control={form.control}
							name="body"
							render={({ field }) => (
								<FormItem className="flex-1 space-y-1">
									<FormControl>
										<Textarea
											rows={1}
											maxLength={MESSAGE_MAX_LENGTH}
											placeholder={t(
												file ? "captionPlaceholder" : "placeholder",
											)}
											aria-label={t("placeholder")}
											className="max-h-32 min-h-9 resize-none text-sm [field-sizing:content]"
											onKeyDown={(event) => {
												if (event.key === "Escape" && editing)
													return onCancelEdit?.();
												if (event.key !== "Enter" || event.shiftKey) return;
												if (event.nativeEvent.isComposing) return;
												event.preventDefault();
												form.handleSubmit(onSubmit)();
											}}
											onPaste={(event) => {
												const pasted = event.clipboardData.files[0];
												if (pasted && !editing) {
													event.preventDefault();
													pick(pasted);
												}
											}}
											{...field}
											onChange={(event) => {
												field.onChange(event);
												if (event.target.value) onTyping?.();
											}}
										/>
									</FormControl>
									<FormMessage className="text-xs" />
								</FormItem>
							)}
						/>
						{showMic ? (
							<Button
								type="button"
								size="icon"
								className="h-9 w-9 shrink-0"
								onClick={() => void recorder.start()}
								aria-label={t("record")}
								title={t("record")}
							>
								<Mic className="h-4 w-4" />
							</Button>
						) : (
							<Button
								type="submit"
								size="icon"
								className="h-9 w-9 shrink-0"
								disabled={isSubmitting}
								aria-label={t(editing ? "save" : "send")}
							>
								{isSubmitting ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : editing ? (
									<Check className="h-4 w-4" />
								) : (
									<SendHorizontal className="h-4 w-4" />
								)}
							</Button>
						)}
					</div>
				)}
			</form>
		</Form>
	);
}
