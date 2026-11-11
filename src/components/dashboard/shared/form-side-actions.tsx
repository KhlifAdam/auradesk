import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** The two-column form layout: fields on the left, actions on the right. */
export const FORM_WITH_SIDE =
	"grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]";

/**
 * A form's Save / Cancel in the right column, stuck to the top while the
 * fields scroll, so the main button is always in view (as on bookings).
 */
export function FormSideActions({
	cancelHref,
	cancelLabel,
	submitLabel,
	submitting,
}: {
	cancelHref: string;
	cancelLabel: string;
	submitLabel: string;
	submitting: boolean;
}) {
	return (
		<aside className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 lg:sticky lg:top-4 lg:self-start">
			<Button type="submit" size="sm" disabled={submitting}>
				{submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
				{submitLabel}
			</Button>
			<Button asChild type="button" variant="ghost" size="sm">
				<Link href={cancelHref}>{cancelLabel}</Link>
			</Button>
		</aside>
	);
}
