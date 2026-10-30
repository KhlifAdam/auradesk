import { z } from "zod";
import { toE164 } from "@/lib/phone";
import { dayKeySchema } from "@/services/calendar/dates";
import { searchQuerySchema } from "@/services/clients/schemas";
import {
	dateInput,
	idSchema,
	moneyAmount,
	optionalEmail,
	optionalText,
	requiredText,
	timeInput,
} from "@/services/shared/schemas";
import {
	LOCATION_TYPES,
	MEDIA_TYPES,
	PAYMENT_STATUSES,
	SERVICE_TYPES,
} from "./options";
import { PROJECT_STAGES } from "./stages";

export const PROJECT_PAGE_SIZE = 20;

export const stageSchema = z.enum(PROJECT_STAGES);
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);

const projectFields = {
	// General
	title: requiredText(120),
	serviceType: z.enum(SERVICE_TYPES),
	mediaType: z.enum(MEDIA_TYPES),
	description: optionalText(2000),
	// Client
	clientPhone: optionalText(40),
	contactName: optionalText(120),
	contactPhone: optionalText(40),
	clientNotes: optionalText(2000),
	// Planning
	eventDate: dateInput,
	startTime: timeInput,
	endTime: timeInput,
	location: optionalText(300),
	locationType: z.enum(LOCATION_TYPES).or(z.literal("")),
	deliveryDeadline: dateInput,
	equipment: optionalText(1000),
	// Money
	price: moneyAmount,
	advance: moneyAmount,
	paymentStatus: paymentStatusSchema,
	financialNotes: optionalText(2000),
	// Organisation
	team: optionalText(300),
	internalNotes: optionalText(2000),
};

const baseSchema = z.object(projectFields);

/** Cross-field rules, shared by the create, update and form schemas. */
function checkProjectRules(
	v: z.infer<typeof baseSchema> & { invitePhone?: boolean },
	ctx: z.RefinementCtx,
) {
	const issue = (path: string, message: string) =>
		ctx.addIssue({ code: "custom", path: [path], message });
	if (v.invitePhone && !toE164(v.clientPhone))
		issue("clientPhone", "invalidPhone");
	if (v.startTime && v.endTime && v.endTime <= v.startTime)
		issue("endTime", "endBeforeStart");
	if (v.price !== null && (v.advance ?? 0) > v.price)
		issue("advance", "advanceTooHigh");
	if (v.eventDate && v.deliveryDeadline && v.deliveryDeadline < v.eventDate)
		issue("deliveryDeadline", "deliveryBeforeEvent");
}

export const projectSchema = baseSchema.superRefine(checkProjectRules);

/** Creating a project can invite its client at the same time. */
export const createProjectSchema = baseSchema
	.extend({ clientEmail: optionalEmail, invitePhone: z.boolean() })
	.superRefine(checkProjectRules);

export const updateProjectSchema = baseSchema
	.extend({ id: idSchema })
	.superRefine(checkProjectRules);

export const updateStageSchema = z.object({ id: idSchema, stage: stageSchema });

export const updatePaymentSchema = z.object({
	id: idSchema,
	paymentStatus: paymentStatusSchema,
});

export const inviteClientSchema = z.object({
	projectId: idSchema,
	/** An email or a phone number. */
	contact: z.string().trim().min(1, "required").max(200, "tooLong"),
});

export const PROJECT_SORTS = ["eventDate", "created", "title"] as const;
export type ProjectSort = (typeof PROJECT_SORTS)[number];

export const listProjectsSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	q: searchQuerySchema,
	stage: stageSchema.optional().catch(undefined),
	/** Event date range, `yyyy-MM-dd`, both days included. */
	from: dayKeySchema.optional().catch(undefined),
	to: dayKeySchema.optional().catch(undefined),
	sort: z.enum(PROJECT_SORTS).optional().catch(undefined),
	order: z.enum(["asc", "desc"]).optional().catch(undefined),
});

export type ProjectValues = z.infer<typeof projectSchema>;
export type CreateProjectValues = z.infer<typeof createProjectSchema>;
export type ListProjectsParams = z.infer<typeof listProjectsSchema>;
