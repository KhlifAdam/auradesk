import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

/** Client side of the password reset: client colours, back to the client login. */
export default function ClientForgotPasswordPage() {
	return <ForgotPasswordForm audience="client" />;
}
