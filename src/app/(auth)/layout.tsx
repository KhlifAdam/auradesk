import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { SpaceBackdrop } from "@/components/shared/space-backdrop";
import { BRAND_NAME } from "@/lib/brand";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Auth.metadata");
	return {
		title: `${t("title")} | ${BRAND_NAME}`,
		description: t("description"),
	};
}

export default async function AuthLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const t = await getTranslations("Auth.layout");

	return (
		<div className="relative isolate grid h-screen grid-cols-1 overflow-hidden bg-background md:grid-cols-2">
			<SpaceBackdrop />
			<div className="relative hidden flex-col overflow-hidden p-10 text-foreground md:flex">
				<Link
					href="/"
					className="relative z-10 flex w-fit items-center gap-2 text-xl font-bold tracking-tight transition-opacity hover:opacity-90"
				>
					<div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-lg">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							aria-label={`${BRAND_NAME} ${t("logoLabel")}`}
							role="img"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="h-5 w-5"
						>
							<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
						</svg>
					</div>
					{BRAND_NAME}
				</Link>
				<AuthShowcase />
			</div>

			<div className="relative overflow-y-auto p-4 sm:p-8 md:p-12">
				<div className="relative z-10 mx-auto flex min-h-full w-full max-w-[400px] items-center py-8 lg:mx-0 lg:ml-12">
					<div className="w-full max-md:rounded-3xl max-md:border max-md:border-border/60 max-md:bg-card/55 max-md:p-6 max-md:shadow-luminous max-md:backdrop-blur-xl">
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
