import { z } from "zod";
import { searchQuerySchema } from "@/services/clients/schemas";
import {
	idSchema,
	optionalText,
	requiredText,
} from "@/services/shared/schemas";

export const TEAM_PAGE_SIZE = 20;
export const ASSIGNED_PAGE_SIZE = 12;

export const memberSchema = z.object({
	name: requiredText(120),
	email: z.email("invalidEmail").trim().max(200, "tooLong"),
	specialty: optionalText(80),
});

export const assignSchema = z.object({
	projectId: idSchema,
	memberId: idSchema,
	role: optionalText(80),
});

export const unassignSchema = z.object({
	projectId: idSchema,
	assignmentId: idSchema,
});

export const listTeamSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	q: searchQuerySchema,
});

export type MemberValues = z.infer<typeof memberSchema>;
export type AssignValues = z.infer<typeof assignSchema>;
export type ListTeamParams = z.infer<typeof listTeamSchema>;
