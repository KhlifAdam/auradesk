"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { TextField } from "@/components/dashboard/shared/form-fields";
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
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { createGallery } from "@/services/galleries/actions";
import { galleryKindSchema } from "@/services/galleries/schemas";
import { requiredText } from "@/services/shared/schemas";
import { GalleryKindPicker } from "../galleries/gallery-kind-picker";

const schema = z.object({ title: requiredText(120), kind: galleryKindSchema });
type Values = z.infer<typeof schema>;
const EMPTY: Values = { title: "", kind: "PROOFS" };

export function NewGalleryDialog({ projectId }: { projectId: string }) {
	const t = useTranslations("Galleries.create");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [open, setOpen] = useState(false);
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: EMPTY,
	});
	const { isSubmitting } = form.formState;

	async function onSubmit(values: Values) {
		const result = await createGallery({ projectId, ...values });
		if (!result.ok) return void toast.error(errorMessage(result.error));
		setOpen(false);
		router.push(`/dashboard/projects/${projectId}/galleries/${result.data.id}`);
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) form.reset(EMPTY);
			}}
		>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
					<Plus className="h-3.5 w-3.5" />
					{t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-3"
					>
						<TextField<Values>
							name="title"
							label={t("name")}
							placeholder={t("placeholder")}
						/>
						<GalleryKindPicker
							value={form.watch("kind")}
							onChange={(kind) => form.setValue("kind", kind)}
						/>
						<DialogFooter>
							<Button type="submit" size="sm" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								)}
								{t("submit")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
