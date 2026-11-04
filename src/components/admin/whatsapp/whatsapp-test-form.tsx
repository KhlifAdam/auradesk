"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TextField } from "@/components/dashboard/shared/form-fields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { sendWhatsappTest } from "@/services/whatsapp/actions";
import {
	type WhatsappTestInput,
	whatsappTestSchema,
} from "@/services/whatsapp/schemas";

/** Sends a test message, to check the linked number really delivers. */
export function WhatsappTestForm() {
	const t = useTranslations("Admin.whatsapp.test");
	const errorMessage = useErrorMessage();
	const form = useForm<WhatsappTestInput>({
		resolver: zodResolver(whatsappTestSchema),
		defaultValues: { phone: "" },
	});
	const { isSubmitting } = form.formState;

	async function onSubmit(values: WhatsappTestInput) {
		const result = await sendWhatsappTest(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("sent"));
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-wrap items-end gap-2"
			>
				<TextField<WhatsappTestInput>
					name="phone"
					type="tel"
					label={t("label")}
					description={t("hint")}
					placeholder={t("placeholder")}
					className="min-w-56 flex-1"
				/>
				<Button
					type="submit"
					size="sm"
					className="mb-5 h-8 gap-1.5 text-xs"
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<Send className="h-3.5 w-3.5" />
					)}
					{t("send")}
				</Button>
			</form>
		</Form>
	);
}
