import { z } from "zod";

const schema = z.object({
	/** Shared with the app: guards every route here and signs the webhook. */
	WA_GATEWAY_SECRET: z.string().min(32),
	/** The app's `/api/internal/whatsapp` route, which records status changes. */
	APP_WEBHOOK_URL: z.url(),
	PORT: z.coerce.number().int().positive().default(4000),
	/** Where the WhatsApp session keys live; a Docker volume in production. */
	AUTH_DIR: z.string().min(1).default("./.data/auth"),
	LOG_LEVEL: z.string().default("warn"),
});

export const env = schema.parse(process.env);
