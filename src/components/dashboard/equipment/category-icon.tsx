import {
	Aperture,
	Camera,
	Cpu,
	HardDrive,
	Lightbulb,
	type LucideIcon,
	Mic,
	Package,
	Plane,
	Triangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EquipmentCategory } from "@/services/equipment/options";

const ICONS: Record<EquipmentCategory, LucideIcon> = {
	CAMERA: Camera,
	LENS: Aperture,
	LIGHTING: Lightbulb,
	AUDIO: Mic,
	DRONE: Plane,
	SUPPORT: Triangle,
	STORAGE: HardDrive,
	COMPUTER: Cpu,
	OTHER: Package,
};

export function CategoryIcon({
	category,
	className,
}: {
	category: EquipmentCategory;
	className?: string;
}) {
	const Icon = ICONS[category];
	return <Icon className={cn("h-4 w-4", className)} />;
}
