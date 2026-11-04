import { z } from "zod";
import { ROLES } from "@/lib/auth/roles";
import { toE164 } from "@/lib/phone";
import { searchQuerySchema } from "@/services/clients/schemas";
import {
	idSchema,
	optionalEmail,
	optionalText,
	requiredText,
} from "@/services/shared/schemas";

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

/** Roles an admin can give from the app; the admin role stays on the command line. */
export const ASSIGNABLE_ROLES = [
	ROLES.photographer,
	ROLES.client,
	ROLES.team,
] as const;

export const setRoleSchema = z.object({
	userId: idSchema,
	role: z.enum(ASSIGNABLE_ROLES),
});

/** Name, email and phone of an account; one of email or phone is needed to sign in. */
export const accountFieldsSchema = z
	.object({
		name: requiredText(100),
		email: optionalEmail,
		phone: z
			.string()
			.trim()
			.refine(
				(value) => value === "" || toE164(value) !== null,
				"invalidPhone",
			),
	})
	.superRefine((value, ctx) => {
		if (!value.email && !value.phone)
			ctx.addIssue({ code: "custom", path: ["email"], message: "required" });
	});

export const updateAccountSchema = z.object({
	userId: idSchema,
	values: accountFieldsSchema,
});

export const deleteAccountSchema = z.object({
	userId: idSchema,
	reason: optionalText(300),
});

export type ListUsersParams = z.infer<typeof listUsersSchema>;
export type AccountFields = z.infer<typeof accountFieldsSchema>;
