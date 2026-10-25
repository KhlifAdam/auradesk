import { z } from "zod";
import { searchQuerySchema } from "@/services/clients/schemas";
import { idSchema, optionalText } from "@/services/shared/schemas";
import { ORDER_STATUSES } from "./types";

export const ORDERS_PAGE_SIZE = 20;

export const listOrdersSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	q: searchQuerySchema,
	status: z.enum(ORDER_STATUSES).optional().catch(undefined),
});
export type ListOrdersParams = z.infer<typeof listOrdersSchema>;

/** The studio accepts an order, optionally at another price. */
export const acceptOrderSchema = z.object({
	id: idSchema,
	/** Overrides the calculated total; empty keeps it. */
	total: z.number().min(0).max(999_999).nullable(),
});

export const sendBackSchema = z.object({
	id: idSchema,
	note: optionalText(500),
});

export const advanceSchema = z.object({
	id: idSchema,
	to: z.enum(["IN_PRODUCTION", "READY", "DELIVERED"]),
});
