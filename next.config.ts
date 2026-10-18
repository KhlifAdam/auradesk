import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./src/lib/security-headers";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Media is served from the public R2 bucket URL.
const r2PublicUrl = process.env.R2_PUBLIC_URL
	? new URL(process.env.R2_PUBLIC_URL)
	: null;

const nextConfig: NextConfig = {
	// Resolves its ffmpeg binary from its own folder at runtime: keep it unbundled.
	serverExternalPackages: ["ffmpeg-static"],
	async headers() {
		return [{ source: "/(.*)", headers: securityHeaders }];
	},
	images: {
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
