"use client";

import type { ReactNode } from "react";
import { type FieldValues, type Path, useFormContext } from "react-hook-form";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface BaseFieldProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	description?: string;
	className?: string;
	/** Marks the label with a * (validation still comes from the schema). */
	required?: boolean;
}

interface TextFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
	placeholder?: string;
	type?: "text" | "email" | "tel" | "url" | "number" | "date" | "time";
	/** Renders a textarea with this many rows. */
	rows?: number;
	prefix?: ReactNode;
	/** `step` of a number input, e.g. `0.001`. */
	step?: string;
	/** Lowest value of a number input (default 0). */
	min?: number;
}

/** Compact text / textarea field bound to the surrounding react-hook-form. */
export function TextField<T extends FieldValues>({
	name,
	label,
	description,
	className,
	placeholder,
	type = "text",
	rows,
	prefix,
	step,
	min = 0,
	required,
}: TextFieldProps<T>) {
	const { control } = useFormContext<T>();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={cn("space-y-1", className)}>
					<FormLabel className="text-xs">
						{label}
						{required && (
							<span aria-hidden className="ml-0.5 text-destructive">
								*
							</span>
						)}
					</FormLabel>
					<FormControl>
						{rows ? (
							<Textarea
								rows={rows}
								placeholder={placeholder}
								className="min-h-0 text-sm"
								{...field}
							/>
						) : (
							<div className="relative flex items-center">
								{prefix && (
									<span className="pointer-events-none absolute left-2.5 text-muted-foreground">
										{prefix}
									</span>
								)}
								<Input
									type={type}
									step={step}
									min={type === "number" ? min : undefined}
									placeholder={placeholder}
									className={cn("h-8 text-sm", prefix && "pl-8")}
									{...field}
									value={field.value ?? ""}
									onChange={(event) => {
										if (type !== "number")
											return field.onChange(event.target.value);
										const { value, valueAsNumber } = event.target;
										field.onChange(value === "" ? null : valueAsNumber);
									}}
								/>
							</div>
						)}
					</FormControl>
					{description && (
						<FormDescription className="text-xs">{description}</FormDescription>
					)}
					<FormMessage className="text-xs" />
				</FormItem>
			)}
		/>
	);
}

/** Inline switch with label + description, bound to a boolean field. */
export function SwitchField<T extends FieldValues>({
	name,
	label,
	description,
	className,
}: BaseFieldProps<T>) {
	const { control } = useFormContext<T>();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem
					className={cn(
						"flex items-center justify-between gap-4 space-y-0 rounded-lg border border-border px-3 py-2",
						className,
					)}
				>
					<div className="flex flex-col gap-0.5">
						<FormLabel className="text-xs font-medium">{label}</FormLabel>
						{description && (
							<FormDescription className="text-xs">
								{description}
							</FormDescription>
						)}
					</div>
					<FormControl>
						<Switch checked={field.value} onCheckedChange={field.onChange} />
					</FormControl>
				</FormItem>
			)}
		/>
	);
}

interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
	options: { value: string; label: string }[];
	/** Adds a choice that stores an empty string. */
	emptyLabel?: string;
}

// Radix Select can't hold an empty value.
const EMPTY = "__empty__";

/** Compact select bound to a string field. */
export function SelectField<T extends FieldValues>({
	name,
	label,
	description,
	className,
	options,
	emptyLabel,
	required,
}: SelectFieldProps<T>) {
	const { control } = useFormContext<T>();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={cn("space-y-1", className)}>
					<FormLabel className="text-xs">
						{label}
						{required && (
							<span aria-hidden className="ml-0.5 text-destructive">
								*
							</span>
						)}
					</FormLabel>
					<Select
						value={field.value || (emptyLabel ? EMPTY : undefined)}
						onValueChange={(value) =>
							field.onChange(value === EMPTY ? "" : value)
						}
					>
						<FormControl>
							<SelectTrigger className="h-8 w-full text-sm">
								<SelectValue />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{emptyLabel && (
								<SelectItem value={EMPTY} className="text-sm">
									{emptyLabel}
								</SelectItem>
							)}
							{options.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
									className="text-sm"
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{description && (
						<FormDescription className="text-xs">{description}</FormDescription>
					)}
					<FormMessage className="text-xs" />
				</FormItem>
			)}
		/>
	);
}
