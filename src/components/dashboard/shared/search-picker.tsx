"use client";

import { ChevronsUpDown, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";
import type { PickerOption } from "@/services/shared/picker";

interface SearchPickerProps {
	/** Server action returning the matches for a query. */
	search: (query: string) => Promise<ActionResult<PickerOption[]>>;
	/** Label of the current choice, or the placeholder when empty. */
	value: string;
	placeholder: string;
	searchPlaceholder: string;
	emptyLabel: string;
	/** Shown under the empty label, e.g. a link to create the first one. */
	emptyAction?: React.ReactNode;
	onPick: (option: PickerOption) => void;
	className?: string;
}

const DEBOUNCE_MS = 250;

/** A button that opens a searchable list of matches fetched from the server. */
export function SearchPicker({
	search,
	value,
	placeholder,
	searchPlaceholder,
	emptyLabel,
	emptyAction,
	onPick,
	className,
}: SearchPickerProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [hits, setHits] = useState<PickerOption[] | null>(null);

	useEffect(() => {
		if (!open) return;
		let stale = false;
		const timer = setTimeout(async () => {
			const result = await search(query);
			if (!stale) setHits(result.ok ? result.data : []);
		}, DEBOUNCE_MS);
		return () => {
			stale = true;
			clearTimeout(timer);
		};
	}, [open, query, search]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className={cn(
						"h-8 w-full justify-between text-sm font-normal",
						!value && "text-muted-foreground",
						className,
					)}
				>
					<span className="truncate">{value || placeholder}</span>
					<ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-72 p-2">
				<div className="relative mb-2">
					<Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						autoFocus
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder={searchPlaceholder}
						className="h-8 pl-8 text-sm"
					/>
				</div>
				<ul className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
					{hits === null && (
						<li className="flex justify-center py-4">
							<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						</li>
					)}
					{hits?.length === 0 && (
						<li className="flex flex-col items-center gap-2 py-4 text-center text-xs text-muted-foreground">
							{emptyLabel}
							{emptyAction}
						</li>
					)}
					{hits?.map((hit) => (
						<li key={hit.id}>
							<button
								type="button"
								onClick={() => {
									onPick(hit);
									setOpen(false);
								}}
								className="flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted"
							>
								<span className="truncate text-sm">{hit.label}</span>
								{hit.detail && (
									<span className="truncate text-[11px] text-muted-foreground">
										{hit.detail}
									</span>
								)}
							</button>
						</li>
					))}
				</ul>
			</PopoverContent>
		</Popover>
	);
}
