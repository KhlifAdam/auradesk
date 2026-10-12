import { useTranslations } from "next-intl";
import { formatDuration } from "@/lib/format";
import type { VideoReport } from "@/services/ai/video-queries";

const percent = (seconds: number, total: number) =>
	`${Math.min(100, Math.max(0, (seconds / Math.max(total, 0.001)) * 100))}%`;

/**
 * The clip as a bar: alternating tints are shots, hatched stretches are
 * silences. Hovering a part tells when it starts.
 */
export function VideoTimeline({ report }: { report: VideoReport }) {
	const t = useTranslations("Ai.video");
	const { durationSec: total } = report;
	const starts = [0, ...report.sceneCuts];

	return (
		<div className="relative h-4 w-full overflow-hidden rounded-md bg-muted">
			{starts.map((start, index) => {
				const end = starts[index + 1] ?? total;
				return (
					<div
						key={start}
						title={t("shotAt", {
							index: index + 1,
							time: formatDuration(start),
						})}
						className={
							index % 2 === 0
								? "absolute inset-y-0 bg-primary/25"
								: "absolute inset-y-0 bg-primary/45"
						}
						style={{
							left: percent(start, total),
							width: percent(end - start, total),
						}}
					/>
				);
			})}
			{report.silences.map((silence) => (
				<div
					key={silence.start}
					title={t("silenceAt", {
						from: formatDuration(silence.start),
						to: formatDuration(silence.end),
					})}
					className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,transparent_0_3px,var(--color-foreground)_3px_4px)] opacity-25"
					style={{
						left: percent(silence.start, total),
						width: percent(silence.end - silence.start, total),
					}}
				/>
			))}
		</div>
	);
}
