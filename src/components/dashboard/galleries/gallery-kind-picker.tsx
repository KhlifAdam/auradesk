"use client";

import { Feather, Gem } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { GalleryKind } from "@/services/galleries/types";

const KINDS = [
	{ kind: "PROOFS", icon: Feather },
	{ kind: "FINAL", icon: Gem },
] as const;

/** Proofs (light copies to choose from) or finals (the delivered photos). */
export function GalleryKindPicker({
	value,
	onChange,
	disabled,
}: {
	value: GalleryKind;
	onChange: (kind: GalleryKind) => void;
	disabled?: boolean;
}) {
	const t = useTranslations("Galleries.kind");
	const id = useId();

	return (
		<RadioGroup
			value={value}
			onValueChange={(next) => onChange(next as GalleryKind)}
			disabled={disabled}
			className="grid gap-2 sm:grid-cols-2"
		>
			{KINDS.map(({ kind, icon: Icon }) => (
				<Label
					key={kind}
					htmlFor={`${id}-${kind}`}
					className={cn(
						"flex cursor-pointer gap-2 rounded-lg border p-2.5 font-normal transition-all duration-200",
						value === kind
							? "border-primary bg-primary/5"
							: "border-border hover:border-primary/40",
					)}
				>
					<RadioGroupItem
						id={`${id}-${kind}`}
						value={kind}
						className="mt-0.5"
					/>
					<span className="flex flex-col gap-1">
						<span className="flex items-center gap-1.5 text-xs font-semibold">
							<Icon className="h-3.5 w-3.5 text-primary" />
							{t(`${kind}.label`)}
						</span>
						<span className="text-[11px] leading-snug text-muted-foreground">
							{t(`${kind}.hint`)}
						</span>
					</span>
				</Label>
			))}
		</RadioGroup>
	);
}
