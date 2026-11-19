import { redirect } from "next/navigation";
import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";
import { AUTH_PATHS } from "@/lib/auth/client-intent";

export default async function VerifyEmailPage({
	searchParams,
}: {
	searchParams: Promise<{ email?: string; audience?: string }>;
}) {
	const { email, audience } = await searchParams;
	// Older links carried ?audience=client: send them to the client screen.
	if (audience === "client" && email) {
		redirect(
			`${AUTH_PATHS.client.verifyEmail}?${new URLSearchParams({ email })}`,
		);
	}
	return <VerifyEmailScreen email={email} audience="photographer" />;
}
