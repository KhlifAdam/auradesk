import { useTranslations } from "next-intl";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { ProjectStage } from "@/services/projects/stages";

/** Delivered stands out in green; Completed, the end, in the brand colour. */
const VARIANT: Partial<Record<ProjectStage, BadgeProps["variant"]>> = {
	DELIVERY: "success",
	COMPLETED: "default",
};

export function StageBadge({ stage }: { stage: ProjectStage }) {
	const t = useTranslations("Projects.stages");

	return (
		<Badge
			variant={VARIANT[stage] ?? "secondary"}
			className="h-5 px-1.5 text-[10px] font-medium"
		>
			{t(stage)}
		</Badge>
	);
}
