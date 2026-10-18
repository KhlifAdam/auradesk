import { RegisterForm } from "@/components/auth/register-form";
import { enabledSocialProviders } from "@/lib/auth/social-providers";

export default function RegisterPage() {
	return (
		<RegisterForm audience="photographer" providers={enabledSocialProviders} />
	);
}
