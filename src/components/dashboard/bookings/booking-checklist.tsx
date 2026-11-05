import { Circle, CircleAlert, CircleCheck } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { Completeness } from "@/services/bookings/completeness";

const REQUIRED = [
	"desiredDate",
	"startTime",
	"location",
	"clientEmail",
	"clientPhone",
	"proposedPrice",
] as const;

interface BookingChecklistProps {
	bookingId: string;
	completeness: Completeness;
}

/** What is still missing before the booking can be confirmed. */
export async function BookingChecklist({
	bookingId,
	completeness,
}: BookingChecklistProps) {
	const t = await getTranslations("Bookings.checklist");
	const ready = completeness.required.length === 0;
	const editHref = `/dashboard/bookings/${bookingId}/edit`;

	return (
		<section
			className={cn(
				"flex flex-col gap-2 rounded-xl border p-3",
				ready
					? "border-success/40 bg-success/5"
					: "border-destructive/30 bg-destructive/5",
			)}
		>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="text-sm font-semibold">
					{ready ? t("ready") : t("title")}
				</h2>
				<Link
					href={editHref}
					className="text-xs font-medium text-primary underline-offset-4 hover:underline"
				>
					{t("complete")}
				</Link>
			</div>
			<ul className="grid gap-1.5 sm:grid-cols-2">
				{REQUIRED.map((field) => {
					const missing = completeness.required.includes(field);
					return (
						<Item
							key={field}
							label={t(`fields.${field}`)}
							tag={t("required")}
							state={missing ? "missing" : "done"}
						/>
					);
				})}
			</ul>
		</section>
	);
}

export function Item({
	label,
	tag,
	state,
}: {
	label: string;
	tag: string;
	state: "done" | "missing" | "todo";
}) {
	const Icon =
		state === "done" ? CircleCheck : state === "missing" ? CircleAlert : Circle;
	return (
		<li className="flex items-center gap-2 text-xs">
			<Icon
				className={cn(
					"h-4 w-4 shrink-0",
					state === "done" && "text-success",
					state === "missing" && "text-destructive",
					state === "todo" && "text-muted-foreground",
				)}
			/>
			<span className={cn(state === "done" && "text-muted-foreground")}>
				{label}
			</span>
			{state !== "done" && (
				<span
					className={cn(
						"rounded px-1 text-[10px] font-medium uppercase",
						state === "missing"
							? "bg-destructive/10 text-destructive"
							: "bg-muted text-muted-foreground",
					)}
				>
					{tag}
				</span>
			)}
		</li>
	);
}
