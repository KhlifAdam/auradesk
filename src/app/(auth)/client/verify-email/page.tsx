import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";

export default async function ClientVerifyEmailPage({
	searchParams,
}: {
	searchParams: Promise<{ email?: string }>;
}) {
	const { email } = await searchParams;
	return <VerifyEmailScreen email={email} audience="client" />;
}
