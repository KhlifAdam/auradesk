"use client";

import { useLocale } from "next-intl";

/** Formats a chart bucket key (`yyyy-MM-dd` or `yyyy-MM`), short or in full. */
export function useBucketLabel(granularity: "day" | "month") {
	const locale = useLocale();
	// Bucket keys are plain dates, so they are formatted as UTC to stay put.
	return (key: string, long = false) =>
		new Intl.DateTimeFormat(
			locale,
			granularity === "day"
				? long
					? { dateStyle: "full", timeZone: "UTC" }
					: { day: "numeric", month: "short", timeZone: "UTC" }
				: long
					? { month: "long", year: "numeric", timeZone: "UTC" }
					: { month: "short", timeZone: "UTC" },
		).format(
			new Date(
				granularity === "day" ? `${key}T12:00:00Z` : `${key}-15T12:00:00Z`,
			),
		);
}
