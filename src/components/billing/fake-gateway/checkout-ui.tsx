import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * The gateway checkout's own look (Konnect's light page, lime accent), kept
 * in this one file. It mirrors the gateway, not the AuraDesk theme, so it
 * stays light whatever the dashboard theme is.
 */
export const gw = {
	page: "min-h-screen bg-[#f7f6fa] text-[#333] [color-scheme:light]",
	label: "text-[13px] font-extralight leading-[19.5px]",
	title: "font-semibold text-[#333]",
	input:
		"relative h-9 w-full appearance-none bg-white px-3 py-2 text-sm text-[#333] outline-none transition ease-in-out placeholder:text-xs placeholder:text-[#9ca3af] focus:z-10 focus:ring-4 focus:ring-blue-300/50 disabled:cursor-progress disabled:bg-gray-100 disabled:opacity-70",
	border: "border-[#e5e7eb] focus:border focus:border-blue-600",
	invalid: "z-10 border border-red-600",
	method:
		"inline-flex min-h-12 w-full items-center justify-between gap-2 rounded-md border border-gray-400/10 bg-white px-4 text-sm font-semibold text-[#333] opacity-80 transition-colors duration-300 hover:bg-[#c2f915] hover:text-neutral-900 focus:outline-none focus:ring-4 focus:ring-gray-300/50 disabled:cursor-progress",
	pay: "inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded-sm bg-[#c2f915] px-4 text-sm font-medium text-black transition-colors duration-300 hover:bg-[#b2e60f] disabled:cursor-progress disabled:opacity-80",
	back: "h-10 rounded-sm bg-[#e2e2e2] px-4 text-sm transition-colors duration-300 hover:bg-[#d4d4d4] disabled:cursor-progress disabled:opacity-70",
	note: "rounded-md border border-[#03003a]/10 bg-[#c2f915]/20 px-3 py-2 text-xs text-[#333]/80",
	alert:
		"rounded-md border border-red-600/20 bg-red-50 px-3 py-2 text-sm text-red-700",
	heading: "text-xl font-bold text-[#03003a]",
} as const;

/** "59 TND", the gateway's way: the currency raised and light. */
export function GatewayAmount({
	amount,
	className,
}: {
	amount: string;
	className?: string;
}) {
	return (
		<p className={cn("whitespace-nowrap font-bold", className)}>
			<span className="font-semibold">{amount}</span>{" "}
			<sup className="text-[18px] font-light">TND</sup>
		</p>
	);
}

/** A field's error, as an icon whose message shows on hover. */
export function FieldError({
	code,
	className,
}: {
	code?: string;
	className?: string;
}) {
	const t = useTranslations("Validation");
	if (!code) return null;
	const message = t.has(code as "required") ? t(code as "required") : code;
	return (
		<span
			className={cn("group absolute top-2 right-3 z-20 inline-flex", className)}
			role="alert"
			aria-label={message}
		>
			<Info className="h-5 w-5 text-red-600" />
			<span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-sm bg-red-600 px-2 py-1 text-xs text-white group-hover:block">
				{message}
			</span>
		</span>
	);
}

/** Amounts in TND with up to three decimals, the gateway's style. */
export const formatGatewayAmount = (amount: number, locale: string) =>
	amount.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
		maximumFractionDigits: 3,
	});

/** The country code's flag; drawn, since Windows shows flag emoji as letters. */
export function TunisianFlag() {
	return (
		<svg
			viewBox="0 85.333 512 341.333"
			className="h-4 w-6 rounded-sm"
			aria-hidden="true"
		>
			<path fill="#D80027" d="M0 85.331h512v341.337H0z" />
			<circle fill="#FFF" cx="256" cy="255.994" r="96" />
			<g fill="#D80027">
				<path d="m267.826 219.291 16.47 22.695 26.673-8.649-16.496 22.676 16.468 22.695-26.664-8.681-16.495 22.676.017-28.04-26.664-8.682 26.674-8.648z" />
				<path d="M277.818 312.724c-31.33 0-56.727-25.397-56.727-56.727s25.397-56.727 56.727-56.727c9.769 0 18.96 2.47 26.985 6.819-12.589-12.31-29.804-19.909-48.803-19.909-38.558 0-69.818 31.259-69.818 69.818s31.26 69.818 69.818 69.818c18.999 0 36.215-7.599 48.803-19.909-8.026 4.347-17.216 6.817-26.985 6.817z" />
			</g>
		</svg>
	);
}
