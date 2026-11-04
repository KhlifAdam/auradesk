/** `kham01@gmail.com` → `kh•••01@gmail.com`; the domain stays readable. */
export function maskEmail(email: string): string {
	const [local = "", domain = ""] = email.split("@");
	const hidden = "•••";
	if (local.length <= 4) return `${local.slice(0, 1)}${hidden}@${domain}`;
	return `${local.slice(0, 2)}${hidden}${local.slice(-2)}@${domain}`;
}

/** `+21620123456` → `••• ••• 456`: only the last three digits show. */
export function maskPhone(phone: string): string {
	return `••• ••• ${phone.replace(/\D/g, "").slice(-3)}`;
}
