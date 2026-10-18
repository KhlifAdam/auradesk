import { redirect } from "next/navigation";
import { z } from "zod";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { AUTH_PATHS } from "@/lib/auth/client-intent";

const paramsSchema = z.object({
	email: z.email(),
	audience: z.enum(["photographer", "client"]).catch("photographer"),
});

export default async function VerifyEmailPage({
	searchParams,
}: {
	searchParams: Promise<{ email?: string; audience?: string }>;
}) {
	const parsed = paramsSchema.safeParse(await searchParams);
	if (!parsed.success) redirect(AUTH_PATHS.photographer.login);

	return <VerifyEmailForm {...parsed.data} />;
}
