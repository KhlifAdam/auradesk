import { z } from "zod";
import { RegisterForm } from "@/components/auth/register-form";
import { enabledSocialProviders } from "@/lib/auth/social-providers";

const emailParam = z.email().catch("");

export default async function ClientRegisterPage({
	searchParams,
}: {
	searchParams: Promise<{ email?: string }>;
}) {
	const email = emailParam.parse((await searchParams).email ?? "");
	return (
		<RegisterForm
			audience="client"
			providers={enabledSocialProviders}
			defaultEmail={email}
		/>
	);
}
