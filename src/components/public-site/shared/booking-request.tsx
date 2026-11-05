"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { submitBookingRequest } from "@/services/bookings/public-action";
import { publicRequestSchema } from "@/services/bookings/schemas";
import { SERVICE_CHOICES } from "@/services/projects/options";
import { useStudioSlug } from "./site-shell";

const formSchema = publicRequestSchema.omit({ slug: true });
type FormValues = z.infer<typeof formSchema>;

const FIELD =
	"site-border w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--s-accent)]";

interface BookingRequestProps {
	/** Used by the mailto fallback when the site has no address (demo data). */
	email: string;
	className: string;
	children: ReactNode;
}

/**
 * A button that opens the studio's request form. It is a native `<dialog>`
 * rendered in place, so it keeps the site's own theme (a portal would not).
 */
export function BookingRequest({
	email,
	className,
	children,
}: BookingRequestProps) {
	const t = useTranslations("PublicSite.booking");
	const tService = useTranslations("Projects.serviceTypes");
	const tValidation = useTranslations("Validation");
	const slug = useStudioSlug();
	const dialog = useRef<HTMLDialogElement>(null);
	const [state, setState] = useState<"form" | "sent" | "failed">("form");
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			serviceType: "WEDDING",
			desiredDate: "",
			message: "",
			website: "",
		},
	});
	const { errors, isSubmitting } = form.formState;

	if (!slug) {
		return email ? (
			<a href={`mailto:${email}`} className={className}>
				{children}
			</a>
		) : null;
	}

	const error = (name: keyof FormValues) => {
		const key = errors[name]?.message;
		if (!key) return null;
		return (
			<p className="mt-1 text-xs text-red-500">
				{tValidation.has(key as never) ? tValidation(key as never) : key}
			</p>
		);
	};

	async function onSubmit(values: FormValues) {
		const result = await submitBookingRequest({ ...values, slug });
		if (!result.ok) return setState("failed");
		form.reset();
		setState("sent");
	}

	return (
		<>
			<button
				type="button"
				className={className}
				onClick={() => {
					setState("form");
					dialog.current?.showModal();
				}}
			>
				{children}
			</button>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: clicking the backdrop is a mouse nicety; Esc closes a native dialog */}
			<dialog
				ref={dialog}
				onClick={(event) => {
					if (event.target === dialog.current) dialog.current?.close();
				}}
				className="site-card site-fg m-auto w-[min(32rem,92vw)] rounded-2xl p-0 backdrop:bg-black/60"
			>
				<div className="flex max-h-[90vh] flex-col gap-4 overflow-y-auto p-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 className="site-heading text-2xl">
								{state === "sent" ? t("sentTitle") : t("title")}
							</h2>
							<p className="site-muted mt-1 text-sm">
								{state === "sent" ? t("sent") : t("description")}
							</p>
						</div>
						<button
							type="button"
							onClick={() => dialog.current?.close()}
							aria-label={t("close")}
							className="site-muted transition-colors hover:text-[var(--s-accent)]"
						>
							<X className="h-5 w-5" />
						</button>
					</div>
					{state !== "sent" && (
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex flex-col gap-3"
							noValidate
						>
							{/* Honeypot: invisible to people, tempting to bots. */}
							<input
								type="text"
								tabIndex={-1}
								autoComplete="off"
								aria-hidden
								className="absolute -left-[9999px]"
								{...form.register("website")}
							/>
							<label className="text-xs font-medium">
								{t("name")}
								<input className={FIELD} {...form.register("name")} />
								{error("name")}
							</label>
							<div className="grid gap-3 sm:grid-cols-2">
								<label className="text-xs font-medium">
									{t("email")}
									<input
										type="email"
										className={FIELD}
										{...form.register("email")}
									/>
									{error("email")}
								</label>
								<label className="text-xs font-medium">
									{t("phone")}
									<input
										type="tel"
										className={FIELD}
										{...form.register("phone")}
									/>
								</label>
							</div>
							<div className="grid gap-3 sm:grid-cols-2">
								<label className="text-xs font-medium">
									{t("service")}
									<select className={FIELD} {...form.register("serviceType")}>
										{SERVICE_CHOICES.map((value) => (
											<option key={value} value={value}>
												{tService(value)}
											</option>
										))}
									</select>
								</label>
								<label className="text-xs font-medium">
									{t("date")}
									<input
										type="date"
										className={FIELD}
										{...form.register("desiredDate")}
									/>
								</label>
							</div>
							<label className="text-xs font-medium">
								{t("message")}
								<textarea
									rows={4}
									placeholder={t("messagePlaceholder")}
									className={FIELD}
									{...form.register("message")}
								/>
								{error("message")}
							</label>
							{state === "failed" && (
								<p className="text-xs text-red-500">{t("failed")}</p>
							)}
							<button
								type="submit"
								disabled={isSubmitting}
								className="site-accent-bg inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
							>
								{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
								{t("send")}
							</button>
						</form>
					)}
				</div>
			</dialog>
		</>
	);
}
