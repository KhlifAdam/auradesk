import "server-only";

import { env } from "@/lib/env";

export const SOCIAL_PROVIDERS = ["github", "google"] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

const credentials = {
	github: {
		clientId: env.GITHUB_CLIENT_ID,
		clientSecret: env.GITHUB_CLIENT_SECRET,
	},
	google: {
		clientId: env.GOOGLE_CLIENT_ID,
		clientSecret: env.GOOGLE_CLIENT_SECRET,
	},
};

/**
 * Providers whose OAuth app is set up in `.env`. Only these are registered
 * with Better Auth and offered as buttons: a button for a provider without
 * keys would only fail after the click.
 */
export const enabledSocialProviders: SocialProvider[] = SOCIAL_PROVIDERS.filter(
	(id) => credentials[id].clientId && credentials[id].clientSecret,
);

export const socialProvidersConfig = Object.fromEntries(
	enabledSocialProviders.map((id) => [
		id,
		{
			clientId: credentials[id].clientId as string,
			clientSecret: credentials[id].clientSecret as string,
		},
	]),
);
