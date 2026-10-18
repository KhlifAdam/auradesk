// HTTP security headers sent with every response (see next.config.ts).
// Plain module, no aliases: next.config.ts loads it before the app's paths.

const isDev = process.env.NODE_ENV === "development";

/** The public media bucket (portfolio, logos). */
const publicMedia = process.env.R2_PUBLIC_URL
	? new URL(process.env.R2_PUBLIC_URL).origin
	: "";
/** Signed links to private galleries, and direct uploads, hit the R2 API. */
const r2Api = "https://*.r2.cloudflarestorage.com";
/** Profile pictures of accounts created with Google or GitHub. */
const avatars =
	"https://lh3.googleusercontent.com https://avatars.githubusercontent.com";

const storage = `${publicMedia} ${r2Api}`.trim();

/**
 * Only this origin's scripts run, and the page can only talk to itself and
 * the storage buckets. Next.js inlines its bootstrap scripts, hence
 * 'unsafe-inline'; development also needs eval and the reload socket.
 */
const contentSecurityPolicy = [
	"default-src 'self'",
	`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
	"style-src 'self' 'unsafe-inline'",
	`img-src 'self' blob: data: ${storage} ${avatars}`,
	`media-src 'self' blob: ${storage}`,
	"font-src 'self' data:",
	`connect-src 'self' ${storage}${isDev ? " ws: wss:" : ""}`,
	"worker-src 'self' blob:",
	"frame-src 'self'",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	// The dashboard previews the public site in an iframe of its own.
	"frame-ancestors 'self'",
	...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

export const securityHeaders = [
	{ key: "Content-Security-Policy", value: contentSecurityPolicy },
	// Older browsers that ignore frame-ancestors: no clickjacking either.
	{ key: "X-Frame-Options", value: "SAMEORIGIN" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=(), payment=()",
	},
	{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
	// HTTPS only, for two years. Skipped locally, where it would pin localhost.
	...(isDev
		? []
		: [
				{
					key: "Strict-Transport-Security",
					value: "max-age=63072000; includeSubDomains; preload",
				},
			]),
];
