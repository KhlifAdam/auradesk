"use client";

import { BookImage, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useErrorMessage } from "@/hooks/use-error-message";
import {
	BOOK_FORMATS,
	BOOK_SIZES_MM,
	type BookFormat,
	MAX_BOOKS_PER_PROJECT,
} from "@/lib/books/formats";
import { createBook } from "@/services/books/actions";

/** Picks the book's size, then opens the editor with the delivered photos already laid out. */
export function CreateBookDialog({
	projectId,
	full,
}: {
	projectId: string;
	/** The project already has as many books as it is allowed. */
	full?: boolean;
}) {
	const t = useTranslations("PhotoBook.create");
	const tFormats = useTranslations("PhotoBook.editor.settings.formats");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [format, setFormat] = useState<BookFormat>("landscape");
	const groupId = useId();
	const [open, setOpen] = useState(false);
	const [pending, startTransition] = useTransition();

	const create = () =>
		startTransition(async () => {
			const result = await createBook({ projectId, format });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			setOpen(false);
			router.push(`/portal/books/${result.data.id}`);
		});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					className="h-8 gap-1.5 text-xs"
					disabled={full}
					title={full ? t("limit", { max: MAX_BOOKS_PER_PROJECT }) : undefined}
				>
					<BookImage className="h-3.5 w-3.5" />
					{t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<RadioGroup
					value={format}
					onValueChange={(value) => setFormat(value as BookFormat)}
					className="grid grid-cols-3 gap-3"
					aria-label={t("size")}
				>
					{BOOK_FORMATS.map((option) => {
						const { w, h } = BOOK_SIZES_MM[option];
						return (
							<label
								key={option}
								htmlFor={`${groupId}-${option}`}
								className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-border p-3 text-center transition-colors duration-200 hover:border-primary/60 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
							>
								<RadioGroupItem
									id={`${groupId}-${option}`}
									value={option}
									className="sr-only"
								/>
								<span
									className="w-12 rounded-[2px] bg-foreground/20"
									style={{ aspectRatio: `${w} / ${h}` }}
								/>
								<span className="text-xs font-medium">{tFormats(option)}</span>
								<span className="text-[11px] text-muted-foreground">
									{w / 10} × {h / 10} cm
								</span>
							</label>
						);
					})}
				</RadioGroup>
				<DialogFooter>
					<Button type="button" disabled={pending} onClick={create}>
						{pending && <Loader2 className="h-4 w-4 animate-spin" />}
						{t("submit")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
