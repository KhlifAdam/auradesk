"use client";

import { BookImage, Check, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useErrorMessage } from "@/hooks/use-error-message";
import {
	BOOK_FORMATS,
	BOOK_SIZES_MM,
	type BookFormat,
} from "@/lib/books/formats";
import { cn } from "@/lib/utils";
import {
	type BookableProject,
	createStudioBook,
	searchBookableProjects,
} from "@/services/books/studio-book-actions";

/** The studio picks a delivered project and a size, then designs the book for the client. */
export function NewBookDialog({
	fixedProjectId,
	small,
}: {
	/** Already on a project: skip the search. */
	fixedProjectId?: string;
	small?: boolean;
}) {
	const t = useTranslations("BookOrders.new");
	const tFormats = useTranslations("PhotoBook.editor.settings.formats");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const id = useId();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [projects, setProjects] = useState<BookableProject[] | null>(null);
	const [projectId, setProjectId] = useState<string | null>(
		fixedProjectId ?? null,
	);
	const [format, setFormat] = useState<BookFormat>("landscape");
	const [pending, startTransition] = useTransition();

	useEffect(() => {
		if (!open || fixedProjectId) return;
		let stale = false;
		const timer = window.setTimeout(async () => {
			const result = await searchBookableProjects(query).catch(() => null);
			if (!stale) setProjects(result?.ok ? result.data : []);
		}, 250);
		return () => {
			stale = true;
			window.clearTimeout(timer);
		};
	}, [open, query, fixedProjectId]);

	const create = () =>
		startTransition(async () => {
			if (!projectId) return;
			const result = await createStudioBook({ projectId, format });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			setOpen(false);
			router.push(`/dashboard/books/${result.data.id}`);
		});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					className={small ? "h-7 gap-1.5 text-xs" : "h-8 gap-1.5 text-xs"}
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

				{!fixedProjectId && (
					<div className="flex flex-col gap-2">
						<div className="relative">
							<Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
							<Input
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder={t("search")}
								aria-label={t("search")}
								className="h-8 pl-8 text-xs"
							/>
						</div>
						<ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
							{projects === null && (
								<li className="flex justify-center py-4">
									<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
								</li>
							)}
							{projects?.length === 0 && (
								<li className="px-2 py-3 text-xs text-muted-foreground">
									{t("empty")}
								</li>
							)}
							{projects?.map((project) => (
								<li key={project.id}>
									<button
										type="button"
										onClick={() => setProjectId(project.id)}
										aria-pressed={projectId === project.id}
										className={cn(
											"flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors duration-200 hover:border-primary/60",
											projectId === project.id
												? "border-primary bg-primary/5"
												: "border-border",
										)}
									>
										<span className="flex min-w-0 flex-col">
											<span className="truncate font-medium">
												{project.title}
											</span>
											<span className="truncate text-muted-foreground">
												{project.clientName}
											</span>
										</span>
										{projectId === project.id && (
											<Check className="h-3.5 w-3.5 shrink-0 text-primary" />
										)}
									</button>
								</li>
							))}
						</ul>
					</div>
				)}

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
								htmlFor={`${id}-${option}`}
								className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-border p-3 text-center transition-colors duration-200 hover:border-primary/60 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
							>
								<RadioGroupItem
									id={`${id}-${option}`}
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
					<Button
						type="button"
						disabled={pending || !projectId}
						onClick={create}
					>
						{pending && <Loader2 className="h-4 w-4 animate-spin" />}
						{t("submit")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
