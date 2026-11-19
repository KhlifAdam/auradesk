"use client";

import { BadgeCheck, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/landing/brand-mark";
import { BRAND_NAME } from "@/lib/brand";
import { GatewayAmount, gw } from "./checkout-ui";

/**
 * The checkout's left side: who is paid, how much, what for, and how long
 * the link stays open. Centred on phones, as a receiver/amount row on wide
 * screens, like the gateway's page.
 */
export function CheckoutSummary({
	amount,
	description,
	remaining,
}: {
	amount: string;
	description: string;
	remaining: string;
}) {
	const t = useTranslations("FakeGateway");
	const receiver = (
		<div className="flex min-w-0 items-center gap-x-2">
			<BrandMark />
			<p className="truncate font-medium">{BRAND_NAME}</p>
			<BadgeCheck
				className="h-6 w-6 shrink-0 fill-[#c2f915] text-[#03003a]"
				aria-label={t("verified")}
			/>
		</div>
	);

	return (
		<div className="flex w-full flex-col items-end lg:px-14 lg:pt-14">
			{/* Phones and tablets */}
			<div className="flex w-full flex-col items-center gap-4 p-6 lg:hidden">
				<div className="self-start">{receiver}</div>
				<p className="flex items-center gap-1 text-[13px] leading-[19.5px]">
					<MessageCircle className="h-4 w-4" />
					{description}
				</p>
				<p className={gw.label}>{t("youPay")}</p>
				<GatewayAmount amount={amount} className="-mt-3 text-[32px]" />
				<div className="flex gap-5">
					<p className={gw.label}>{t("expiresIn")}</p>
					<b>{remaining}</b>
				</div>
			</div>

			{/* Wide screens */}
			<div className="hidden w-full max-w-md flex-col lg:flex">
				<div className="mb-4">
					<p className={gw.label}>{t("expiresIn")}</p>
					<b>{remaining}</b>
				</div>
				<div className={`flex justify-between ${gw.label}`}>
					<p>{t("receiver")}</p>
					<p>{t("youPay")}</p>
				</div>
				<div className="mt-2 mb-4 grid grid-cols-2 items-center gap-x-4">
					{receiver}
					<GatewayAmount amount={amount} className="text-right text-2xl" />
				</div>
				<p className="mt-4 whitespace-pre-line text-[13px] leading-[19.5px]">
					{description}
				</p>
			</div>
		</div>
	);
}
