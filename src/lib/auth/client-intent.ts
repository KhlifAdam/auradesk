import { ROLES } from "./roles";

/** Set right before a client sign-up, so the new account gets the client role. */
export const CLIENT_INTENT_COOKIE = "auradesk_client_intent";
export const CLIENT_INTENT_VALUE = "client";
export const CLIENT_INTENT_MAX_AGE_SECONDS = 60 * 15;

export type AuthAudience = "photographer" | "client";

/**
 * Every client screen lives under this prefix. The folder `app/(auth)/client`
 * gives them the client's colour (green) and `audienceFromPath` the client's
 * photo, so a client screen outside it shows up in the studio's gold.
 */
export const CLIENT_AUTH_ROOT = "/client";

/** The side an auth screen belongs to, read from its URL. */
export const audienceFromPath = (pathname: string): AuthAudience =>
	pathname === CLIENT_AUTH_ROOT || pathname.startsWith(`${CLIENT_AUTH_ROOT}/`)
		? "client"
		: "photographer";

/** Auth screens and post-auth landing per audience. Client screens: see CLIENT_AUTH_ROOT. */
export const AUTH_PATHS = {
	photographer: {
		/** The studio side's presentation, reached from the hub. */
		welcome: "/photographers",
		login: "/login",
		register: "/register",
		forgotPassword: "/forgot-password",
		resetPassword: "/reset-password",
		verifyEmail: "/verify-email",
		home: "/dashboard",
	},
	client: {
		/** Where clients arrive from the hub or a studio's site, before signing in. */
		welcome: "/client",
		login: "/client/login",
		register: "/client/register",
		/** Sign in or sign up with a phone number and a texted code. */
		phone: "/client/phone",
		forgotPassword: "/client/forgot-password",
		resetPassword: "/client/reset-password",
		/** Under /client so the screen takes the client's colour. */
		verifyEmail: "/client/verify-email",
		home: "/portal",
	},
} as const satisfies Record<AuthAudience, Record<string, string>>;

/**
 * Roles allowed to sign in on each side's page. A photographer is never a
 * client, so each page takes only its own role. Administrators have a page of
 * their own (`ADMIN_PATHS.login`) and are turned away here.
 */
export const AUDIENCE_ROLES: Record<AuthAudience, readonly string[]> = {
	photographer: [ROLES.photographer],
	client: [ROLES.client],
};

/** Where an account that still has to prove its email address goes. */
export const verifyEmailPath = (email: string, audience: AuthAudience) =>
	`${AUTH_PATHS[audience].verifyEmail}?${new URLSearchParams({ email })}`;
