import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AUTH_PATHS } from "@/lib/auth/client-intent";

export default async function ClientResetPasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ email?: string }>;
}) {
	const { email } = await searchParams;
	if (!email) redirect(AUTH_PATHS.client.forgotPassword);

	return <ResetPasswordForm email={email} audience="client" />;
}
