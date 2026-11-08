import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./src/lib/security-headers";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Media is served from the public R2 bucket URL.
const r2PublicUrl = process.env.R2_PUBLIC_URL
	? new URL(process.env.R2_PUBLIC_URL)
	: null;

const nextConfig: NextConfig = {
	// Self-contained server for the Docker image: `.next/standalone/server.js`.
	output: "standalone",
	// Resolves its ffmpeg binary from its own folder at runtime: keep it unbundled.
	serverExternalPackages: ["ffmpeg-static"],
	experimental: {
		// Photos uploaded before web resizing can be 24 MP: decoding several at
		// once overruns the default 7 s and the image fails to load.
		imgOptTimeoutInSeconds: 30,
	},
	async headers() {
		return [{ source: "/(.*)", headers: securityHeaders }];
	},
	images: {
		// A photography product: photos are served sharp. The default (75) is
		// coerced to the closest allowed value, so every <Image> gets 90; at 75
		// already-compressed JPEGs were visibly smudged by the second encode.
		qualities: [90],
		remotePatterns: r2PublicUrl
			? [
					{
						protocol: r2PublicUrl.protocol.replace(":", "") as "http" | "https",
						hostname: r2PublicUrl.hostname,
						// Empty for default ports; needed for e.g. a local MinIO on :9000.
						port: r2PublicUrl.port,
					},
				]
			: [],
	},
};

export default withNextIntl(nextConfig);
