import type { EquipmentBookingValues, EquipmentValues } from "./schemas";
import type { EquipmentDetail } from "./types";

export const emptyEquipmentValues = (): EquipmentValues => ({
	name: "",
	category: "CAMERA",
	brand: "",
	model: "",
	serialNumber: "",
	status: "ACTIVE",
	ownership: "OWNED",
	purchaseDate: "",
	purchasePrice: null,
	dailyRate: null,
	notes: "",
});

export function equipmentToValues(item: EquipmentDetail): EquipmentValues {
	return {
		name: item.name,
		category: item.category,
		brand: item.brand,
		model: item.model,
		serialNumber: item.serialNumber,
		status: item.status,
		ownership: item.ownership,
		purchaseDate: item.purchaseDate?.slice(0, 10) ?? "",
		purchasePrice: item.purchasePrice,
		dailyRate: item.dailyRate,
		notes: item.notes,
	};
}

export function emptyBookingValues(
	prefill: Partial<EquipmentBookingValues> = {},
): EquipmentBookingValues {
	const today = new Date().toISOString().slice(0, 10);
	return {
		equipmentId: "",
		projectId: "",
		kind: "PROJECT",
		startDate: today,
		endDate: today,
		partyName: "",
		amount: null,
		notes: "",
		...prefill,
	};
}
