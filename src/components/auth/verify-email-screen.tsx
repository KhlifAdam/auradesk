import { redirect } from "next/navigation";
import { z } from "zod";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { AUTH_PATHS, type AuthAudience } from "@/lib/auth/client-intent";

const emailSchema = z.email();

/** The verify screen of one side; the route decides the audience (and so the colour). */
export function VerifyEmailScreen({
	email,
	audience,
}: {
	email: string | undefined;
	audience: AuthAudience;
}) {
	const parsed = emailSchema.safeParse(email);
	if (!parsed.success) redirect(AUTH_PATHS[audience].login);
	return <VerifyEmailForm email={parsed.data} audience={audience} />;
}
