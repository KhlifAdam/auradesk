"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AUTH_PATHS, type AuthAudience } from "@/lib/auth/client-intent";

const IMAGES: Record<AuthAudience, string> = {
	photographer: "/images/auradesk-portrait.jpg",
	client: "/images/auradesk-gallery.jpg",
};

/** Client auth screens live under /client; everything else is the studio side. */
export function useAuthAudience(): AuthAudience {
	const pathname = usePathname();
	const clientRoot = AUTH_PATHS.client.login.split("/")[1];
	return pathname.split("/")[1] === clientRoot ? "client" : "photographer";
}

/** Left panel of the auth screens: photo matching the audience. */
export function AuthShowcase() {
	const audience = useAuthAudience();
	const t = useTranslations(`Auth.layout.${audience}`);

	return (
		<div className="pointer-events-none absolute inset-0 flex items-center justify-center lg:justify-end lg:pr-24">
			<div className="absolute right-1/4 top-1/4 h-32 w-32 rounded-full bg-primary/30 blur-[60px]" />
			<div className="absolute bottom-1/4 left-1/4 h-40 w-40 rounded-full bg-chart-2/20 blur-[60px]" />
			<div className="relative aspect-[4/5] w-full max-w-md -rotate-3 overflow-hidden rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-out">
				<Image
					key={audience}
					src={IMAGES[audience]}
					alt={t("imageAlt")}
					fill
					sizes="(min-width: 768px) 28rem, 0px"
					className="h-full w-full animate-in fade-in object-cover duration-700"
					priority
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
				<div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-white/10" />
			</div>
		</div>
	);
}
