import { z } from "zod";
import { idSchema } from "@/services/shared/schemas";
import { MESSAGE_MAX_LENGTH } from "./constants";
import { MESSAGE_ROLES } from "./viewer";

export const messageBodySchema = z
	.string()
	.trim()
	.min(1, "required")
	.max(MESSAGE_MAX_LENGTH, "tooLong");

/** The form only holds the text. */
export const composerSchema = z.object({ body: messageBodySchema });

/** Targets an existing conversation, or a partner to start one with. */
export const sendMessageSchema = z
	.object({
		as: z.enum(MESSAGE_ROLES),
		conversationId: idSchema.nullable(),
		partnerId: idSchema.nullable(),
		body: messageBodySchema,
	})
	.refine((v) => v.conversationId || v.partnerId, "invalidInput");

export const markReadSchema = z.object({
	conversationId: idSchema,
	as: z.enum(MESSAGE_ROLES),
});

export const editMessageSchema = z.object({
	as: z.enum(MESSAGE_ROLES),
	messageId: idSchema,
	body: messageBodySchema,
});

export const deleteMessageSchema = z.object({
	as: z.enum(MESSAGE_ROLES),
	messageId: idSchema,
});

export const searchClientsSchema = z.string().trim().max(80);

export const messagesParamsSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	/** Open conversation. */
	c: idSchema.optional().catch(undefined),
	/** Draft with this client (dashboard). */
	client: idSchema.optional().catch(undefined),
	/** Draft with this studio (portal). */
	studio: idSchema.optional().catch(undefined),
});

export type ComposerValues = z.infer<typeof composerSchema>;
export type MessagesParams = z.infer<typeof messagesParamsSchema>;
