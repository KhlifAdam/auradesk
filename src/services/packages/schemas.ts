import { z } from "zod";
import {
	idSchema,
	optionalText,
	requiredText,
} from "@/services/shared/schemas";

export const CURRENCIES = ["TND", "EUR", "USD"] as const;
export const MAX_DELIVERABLES = 20;
export const MAX_PACKAGES = 50;
export const PACKAGE_PAGE_SIZE = 12;

export const packageSchema = z.object({
	name: requiredText(80),
	description: optionalText(1000),
	price: z
		.number({ error: "invalidPrice" })
		.min(0, "invalidPrice")
		.max(1_000_000, "invalidPrice"),
	currency: z.enum(CURRENCIES),
	durationMinutes: z
		.number({ error: "invalidNumber" })
		.int("invalidNumber")
		.positive("invalidNumber")
		.max(60 * 24 * 7, "invalidNumber")
		.nullable(),
	unlimitedDuration: z.boolean(),
	photoCount: z
		.number({ error: "invalidNumber" })
		.int("invalidNumber")
		.positive("invalidNumber")
		.max(100_000, "invalidNumber")
		.nullable(),
	unlimitedPhotos: z.boolean(),
	deliverables: z.array(requiredText(120)).max(MAX_DELIVERABLES, "tooLong"),
	coverMediaId: idSchema.nullable(),
	active: z.boolean(),
	featured: z.boolean(),
});

export const updatePackageSchema = packageSchema.extend({ id: idSchema });

export type PackageValues = z.infer<typeof packageSchema>;
