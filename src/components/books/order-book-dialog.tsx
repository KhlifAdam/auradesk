"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { BookFormat } from "@/lib/books/formats";
import {
	type BookOrderOptions,
	bookOrderOptionsSchema,
	computeQuote,
	MAX_COPIES,
	type PriceList,
} from "@/lib/books/pricing";
import { submitBook } from "@/services/books/order-actions";
import { QuoteSummary } from "./quote-summary";

interface OrderBookDialogProps {
	bookId: string;
	studioName: string;
	priceList: PriceList;
	format: BookFormat;
	pages: number;
	hasCover: boolean;
	/** Saves pending changes first: the studio prints what is saved. */
	flush: () => Promise<unknown>;
}

/** Choosing cover, paper and extras, seeing the price, and sending the book to the studio. */
export function OrderBookDialog({
	bookId,
	studioName,
	priceList,
	format,
	pages,
	hasCover,
	flush,
}: OrderBookDialogProps) {
	const t = useTranslations("PhotoBook.order");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const id = useId();
	const [open, setOpen] = useState(false);
	const form = useForm<BookOrderOptions>({
		resolver: zodResolver(bookOrderOptionsSchema),
		defaultValues: {
			coverId: priceList.covers[0]?.id ?? "",
			paperId: priceList.papers[0]?.id ?? "",
			extraIds: [],
			copies: 1,
			note: "",
		},
	});
	const values = form.watch();
	const { isSubmitting } = form.formState;

	const problem = !priceList.enabled
		? t("closed", { studio: studioName })
		: !hasCover
			? t("noCover")
			: pages < priceList.minPages
				? t("tooFew", { min: priceList.minPages, count: pages })
				: null;
	const quoted = computeQuote(priceList, { format, pages }, values);

	async function onSubmit(options: BookOrderOptions) {
		await flush();
		const result = await submitBook({ id: bookId, options });
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("sent", { studio: studioName }));
		setOpen(false);
		router.refresh();
	}

	const toggleExtra = (extraId: string, on: boolean) => {
		const current = form.getValues("extraIds");
		form.setValue(
			"extraIds",
			on ? [...current, extraId] : current.filter((e) => e !== extraId),
			{
				shouldDirty: true,
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="gap-1.5">
					<ShoppingBag className="h-4 w-4" />
					{t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>
						{t("description", { studio: studioName })}
					</DialogDescription>
				</DialogHeader>

				{problem ? (
					<p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
						{problem}
					</p>
				) : (
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-4"
					>
						<fieldset className="flex flex-col gap-2">
							<legend className="mb-1 text-sm font-medium">{t("cover")}</legend>
							<RadioGroup
								value={values.coverId}
								onValueChange={(v) => form.setValue("coverId", v)}
							>
								{priceList.covers.map((cover) => (
									<Choice
										key={cover.id}
										id={`${id}-c-${cover.id}`}
										name={cover.name}
										price={cover.price}
									>
										<RadioGroupItem
											id={`${id}-c-${cover.id}`}
											value={cover.id}
										/>
									</Choice>
								))}
							</RadioGroup>
						</fieldset>
						<fieldset className="flex flex-col gap-2">
							<legend className="mb-1 text-sm font-medium">{t("paper")}</legend>
							<RadioGroup
								value={values.paperId}
								onValueChange={(v) => form.setValue("paperId", v)}
							>
								{priceList.papers.map((paper) => (
									<Choice
										key={paper.id}
										id={`${id}-p-${paper.id}`}
										name={paper.name}
										price={paper.price}
									>
										<RadioGroupItem
											id={`${id}-p-${paper.id}`}
											value={paper.id}
										/>
									</Choice>
								))}
							</RadioGroup>
						</fieldset>
						{priceList.extras.length > 0 && (
							<fieldset className="flex flex-col gap-2">
								<legend className="mb-1 text-sm font-medium">
									{t("extras")}
								</legend>
								{priceList.extras.map((extra) => (
									<Choice
										key={extra.id}
										id={`${id}-e-${extra.id}`}
										name={extra.name}
										price={extra.price}
									>
										<Checkbox
											id={`${id}-e-${extra.id}`}
											checked={values.extraIds.includes(extra.id)}
											onCheckedChange={(on) =>
												toggleExtra(extra.id, on === true)
											}
										/>
									</Choice>
								))}
							</fieldset>
						)}
						<div className="flex items-center justify-between gap-3">
							<label htmlFor={`${id}-copies`} className="text-sm font-medium">
								{t("copies")}
							</label>
							<Input
								id={`${id}-copies`}
								type="number"
								min={1}
								max={MAX_COPIES}
								className="w-20"
								{...form.register("copies", { valueAsNumber: true })}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label htmlFor={`${id}-note`} className="text-sm font-medium">
								{t("note")}
							</label>
							<Textarea
								id={`${id}-note`}
								rows={2}
								maxLength={500}
								placeholder={t("notePlaceholder")}
								{...form.register("note")}
							/>
						</div>

						<div className="rounded-lg border border-border bg-muted/30 p-3">
							{quoted.ok ? (
								<QuoteSummary
									quote={quoted.quote}
									format={format}
									pages={pages}
								/>
							) : (
								<p className="text-sm text-destructive">
									{errorMessage(quoted.error)}
								</p>
							)}
							{priceList.leadTimeDays > 0 && (
								<p className="mt-2 text-[11px] text-muted-foreground">
									{t("leadTime", { days: priceList.leadTimeDays })}
								</p>
							)}
						</div>
						<DialogFooter>
							<Button type="submit" disabled={isSubmitting || !quoted.ok}>
								{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
								{t("submit", { studio: studioName })}
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}

/** One option with its control and what it adds to the price. */
function Choice({
	id,
	name,
	price,
	children,
}: {
	id: string;
	name: string;
	price: number;
	children: React.ReactNode;
}) {
	const t = useTranslations("PhotoBook.order");
	return (
		<div className="flex items-center gap-2.5">
			{children}
			<label
				htmlFor={id}
				className="flex flex-1 cursor-pointer justify-between gap-3 text-sm"
			>
				<span>{name}</span>
				<span className="text-muted-foreground tabular-nums">
					{price > 0 ? t("adds", { price }) : t("included")}
				</span>
			</label>
		</div>
	);
}
