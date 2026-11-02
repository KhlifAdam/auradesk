"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Pencil, SendHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { MESSAGE_MAX_LENGTH } from "@/services/messages/constants";
import {
	type ComposerValues,
	composerSchema,
} from "@/services/messages/schemas";

interface MessageComposerProps {
	/** Resolves to an error code, or null once sent. */
	onSend: (body: string) => Promise<string | null>;
	/** Called on every keystroke, to tell the partner someone is typing. */
	onTyping?: () => void;
	/** The message being edited: the text moves into the box until saved. */
	editing?: { id: string; body: string } | null;
	onCancelEdit?: () => void;
}

/** Enter sends, Shift+Enter adds a line. */
export function MessageComposer({
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
	const editingId = editing?.id;
	const editingBody = editing?.body;

	// Opening an edit loads its text; leaving it empties the box again.
	useEffect(() => {
		form.reset({ body: editingBody ?? "" });
		if (editingId) form.setFocus("body");
	}, [editingId, editingBody, form]);

	async function onSubmit({ body }: ComposerValues) {
		const error = await onSend(body);
		if (error) return void toast.error(errorMessage(error));
		form.reset({ body: "" });
	}

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
				<div className="flex items-end gap-2">
					<FormField
						control={form.control}
						name="body"
						render={({ field }) => (
							<FormItem className="flex-1 space-y-1">
								<FormControl>
									<Textarea
										rows={1}
										maxLength={MESSAGE_MAX_LENGTH}
										placeholder={t("placeholder")}
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
				</div>
			</form>
		</Form>
	);
}
