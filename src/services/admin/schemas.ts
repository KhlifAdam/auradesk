import { z } from "zod";
import { ROLES } from "@/lib/auth/roles";
import { searchQuerySchema } from "@/services/clients/schemas";
import { idSchema, optionalText } from "@/services/shared/schemas";

export const ADMIN_USERS_PAGE_SIZE = 25;

export const ROLE_FILTERS = [
	ROLES.photographer,
	ROLES.client,
	ROLES.team,
	ROLES.admin,
] as const;

export const listUsersSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	q: searchQuerySchema,
	role: z.enum(ROLE_FILTERS).optional().catch(undefined),
});

export const banSchema = z.object({
	userId: idSchema,
	reason: optionalText(300),
});

export type ListUsersParams = z.infer<typeof listUsersSchema>;
