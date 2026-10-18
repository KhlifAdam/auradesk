import { LoginForm } from "@/components/auth/login-form";
import { enabledSocialProviders } from "@/lib/auth/social-providers";

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>;
}) {
	const { error } = await searchParams;
	return (
		<LoginForm
			audience="photographer"
			providers={enabledSocialProviders}
			oauthError={error}
		/>
	);
}
