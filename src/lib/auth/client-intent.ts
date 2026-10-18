import { ROLES } from "./roles";

/** Set right before a client sign-up, so the new account gets the client role. */
export const CLIENT_INTENT_COOKIE = "lumodesk_client_intent";
export const CLIENT_INTENT_VALUE = "client";
export const CLIENT_INTENT_MAX_AGE_SECONDS = 60 * 15;

export type AuthAudience = "photographer" | "client";

/** Auth screens and post-auth landing per audience. */
export const AUTH_PATHS = {
	photographer: {
		/** The studio side's presentation, reached from the hub. */
		welcome: "/photographers",
		login: "/login",
		register: "/register",
		home: "/dashboard",
	},
	client: {
		/** Where clients arrive from the hub or a studio's site, before signing in. */
		welcome: "/client",
		login: "/client/login",
		register: "/client/register",
		/** Sign in or sign up with a phone number and a texted code. */
		phone: "/client/phone",
		home: "/portal",
	},
} as const satisfies Record<AuthAudience, Record<string, string>>;

/**
 * Roles allowed to sign in on each side's page. A photographer can also be a
 * client of another studio, so the client page takes both.
 */
export const AUDIENCE_ROLES: Record<AuthAudience, readonly string[]> = {
	photographer: [ROLES.photographer, ROLES.admin],
	client: [ROLES.client, ROLES.photographer],
};

/** Where an account that still has to prove its email address goes. */
export const verifyEmailPath = (email: string, audience: AuthAudience) =>
	`/verify-email?${new URLSearchParams({ email, audience })}`;
