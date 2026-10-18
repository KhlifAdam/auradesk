import { z } from "zod";

const coreSchema = z.object({
	DATABASE_URL: z.url(),
	BETTER_AUTH_SECRET: z.string().min(1),
	BETTER_AUTH_URL: z.url(),
	GITHUB_CLIENT_ID: z.string().optional(),
	GITHUB_CLIENT_SECRET: z.string().optional(),
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),
	/** Bearer token the scheduler sends to /api/cron/*; unset disables them. */
	CRON_SECRET: z.string().min(16).optional(),
});

const r2CredentialsSchema = z.object({
	R2_ACCOUNT_ID: z.string().min(1),
	R2_ACCESS_KEY_ID: z.string().min(1),
	R2_SECRET_ACCESS_KEY: z.string().min(1),
});

const r2Schema = r2CredentialsSchema.extend({
	R2_BUCKET: z.string().min(1),
	// Public CDN base for stored media keys; trailing slash is normalized away.
	R2_PUBLIC_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
});

/** Core server env, validated once at startup. */
export const env = coreSchema.parse(process.env);

// Client galleries; this bucket must have no public access.
const r2PrivateSchema = r2CredentialsSchema.extend({
	R2_PRIVATE_BUCKET: z.string().min(1),
});

let r2Env: z.infer<typeof r2Schema> | undefined;

/** R2 env, validated lazily so the app boots without storage configured. */
export function getR2Env() {
	r2Env ??= r2Schema.parse(process.env);
	return r2Env;
}

let r2Credentials: z.infer<typeof r2CredentialsSchema> | undefined;
let r2PrivateEnv: z.infer<typeof r2PrivateSchema> | undefined;

export function getR2Credentials() {
	r2Credentials ??= r2CredentialsSchema.parse(process.env);
	return r2Credentials;
}

export function getR2PrivateEnv() {
	r2PrivateEnv ??= r2PrivateSchema.parse(process.env);
	return r2PrivateEnv;
}
