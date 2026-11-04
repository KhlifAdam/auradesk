import { PhoneForm } from "@/components/auth/phone-form";
import { codeChannel } from "@/lib/whatsapp/connection-status";

interface ClientPhonePageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Sign in or sign up with a phone number; invitation texts link here. */
export default async function ClientPhonePage({
	searchParams,
}: ClientPhonePageProps) {
	const { phone } = await searchParams;
	return (
		<PhoneForm
			defaultPhone={typeof phone === "string" ? phone : ""}
			channel={await codeChannel()}
		/>
	);
}
