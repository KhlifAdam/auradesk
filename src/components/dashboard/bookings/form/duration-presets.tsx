"use client";

import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";

const DURATION_PRESETS = [1, 2, 4, 8] as const;

interface DurationFields {
	startTime: string;
	durationHours: number | null;
}

/** `14:30` + 2.5 hours → `17:00` (null when past midnight or unset). */
function endTime(start: string, hours: number | null) {
	if (!start || !hours) return null;
	const [h, m] = start.split(":").map(Number);
	const total = h * 60 + m + Math.round(hours * 60);
	if (total >= 24 * 60) return null;
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/**
 * Quick duration choices and the end time they give, shown under the duration
 * field. Works in any form with `startTime` and `durationHours` fields.
 */
export function DurationPresets() {
	const t = useTranslations("Bookings.form.need");
	const { control, setValue } = useFormContext<DurationFields>();
	const [startTime, durationHours] = useWatch({
		control,
		name: ["startTime", "durationHours"],
	});
	const end = endTime(startTime, durationHours);

	return (
		<>
			<div className="flex flex-wrap items-center gap-1.5">
				{DURATION_PRESETS.map((hours) => (
					<Button
						key={hours}
						type="button"
						size="sm"
						variant={durationHours === hours ? "secondary" : "outline"}
						className="h-6 px-2 text-xs"
						onClick={() =>
							setValue("durationHours", hours, { shouldDirty: true })
						}
					>
						{t("hours", { count: hours })}
					</Button>
				))}
			</div>
			{end && (
				<p className="text-xs text-muted-foreground">
					{t("endsAt", { time: end })}
				</p>
			)}
		</>
	);
}
