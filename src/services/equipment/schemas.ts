import { z } from "zod";
import { searchQuerySchema } from "@/services/clients/schemas";
import {
	dateInput,
	idSchema,
	moneyAmount,
	optionalText,
	requiredText,
} from "@/services/shared/schemas";
import {
	AVAILABILITY_FILTERS,
	EQUIPMENT_BOOKING_KINDS,
	EQUIPMENT_CATEGORIES,
	EQUIPMENT_OWNERSHIPS,
	EQUIPMENT_STATUSES,
} from "./options";

export const EQUIPMENT_PAGE_SIZE = 20;
export const EQUIPMENT_BOOKING_PAGE_SIZE = 15;
/** Longest single booking; anything longer is a mistake or a sale. */
const MAX_BOOKING_DAYS = 366;

export const equipmentSchema = z.object({
	name: requiredText(120),
	category: z.enum(EQUIPMENT_CATEGORIES),
	brand: optionalText(80),
	model: optionalText(80),
	serialNumber: optionalText(80),
	status: z.enum(EQUIPMENT_STATUSES),
	ownership: z.enum(EQUIPMENT_OWNERSHIPS),
	purchaseDate: dateInput,
	purchasePrice: moneyAmount,
	dailyRate: moneyAmount,
	notes: optionalText(2000),
});

export const updateEquipmentSchema = equipmentSchema.extend({ id: idSchema });

const DAY_MS = 86_400_000;

export const equipmentBookingSchema = z
	.object({
		equipmentId: idSchema,
		projectId: z.string(),
		kind: z.enum(EQUIPMENT_BOOKING_KINDS),
		startDate: dateInput.refine((v) => v !== "", "required"),
		endDate: dateInput.refine((v) => v !== "", "required"),
		partyName: optionalText(120),
		amount: moneyAmount,
		notes: optionalText(1000),
	})
	.superRefine((v, ctx) => {
		if (v.endDate < v.startDate)
			ctx.addIssue({
				code: "custom",
				path: ["endDate"],
				message: "endBeforeStart",
			});
		else if (
			Date.parse(v.endDate) - Date.parse(v.startDate) >
			MAX_BOOKING_DAYS * DAY_MS
		)
			ctx.addIssue({
				code: "custom",
				path: ["endDate"],
				message: "rangeTooLong",
			});
		if (v.kind === "PROJECT" && !v.projectId)
			ctx.addIssue({
				code: "custom",
				path: ["projectId"],
				message: "required",
			});
	});

export const bookingRefSchema = z.object({
	equipmentId: idSchema,
	bookingId: idSchema,
});

export const listEquipmentSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	q: searchQuerySchema,
	category: z.enum(EQUIPMENT_CATEGORIES).optional().catch(undefined),
	availability: z.enum(AVAILABILITY_FILTERS).optional().catch(undefined),
});

export const equipmentPageSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
});

export type EquipmentValues = z.infer<typeof equipmentSchema>;
export type EquipmentBookingValues = z.infer<typeof equipmentBookingSchema>;
export type ListEquipmentParams = z.infer<typeof listEquipmentSchema>;
