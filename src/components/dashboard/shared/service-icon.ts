import {
	Building2,
	Cake,
	Camera,
	Gem,
	GraduationCap,
	Heart,
	type LucideIcon,
	Megaphone,
	PartyPopper,
	ShoppingBag,
	User,
} from "lucide-react";
import type { ServiceType } from "@/services/projects/options";

/** One icon per kind of shoot, for cards without a photo. */
export const SERVICE_ICONS: Record<ServiceType, LucideIcon> = {
	WEDDING: Heart,
	ENGAGEMENT: Gem,
	BIRTHDAY: Cake,
	EVENT: PartyPopper,
	PRODUCT: ShoppingBag,
	PORTRAIT: User,
	ADVERTISING: Megaphone,
	CORPORATE: Building2,
	OTHER: Camera,
	PFE: GraduationCap,
	PUB: Megaphone,
};
