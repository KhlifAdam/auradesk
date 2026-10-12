"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const ALL = "all";

interface UrlSelectFilterProps {
	/** The search param it controls, e.g. `status`. */
	param: string;
	active?: string;
	allLabel: string;
	ariaLabel: string;
	options: { value: string; label: string }[];
}

/** A select kept in `?<param>=`; changing it resets to page 1. */
export function UrlSelectFilter({
	param,
	active,
	allLabel,
	ariaLabel,
	options,
}: UrlSelectFilterProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const onChange = (value: string) => {
		const params = new URLSearchParams(searchParams);
		params.delete("page");
		if (value === ALL) params.delete(param);
		else params.set(param, value);
		router.replace(`${pathname}?${params}`, { scroll: false });
	};

	return (
		<Select value={active ?? ALL} onValueChange={onChange}>
			<SelectTrigger className="h-8 w-44 text-xs" aria-label={ariaLabel}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={ALL} className="text-xs">
					{allLabel}
				</SelectItem>
				{options.map((option) => (
					<SelectItem
						key={option.value}
						value={option.value}
						className="text-xs"
					>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
