import {
	Mail,
	MessageCircle,
	MessageSquare,
	Phone,
	UserRound,
} from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { formatPhone, toE164 } from "@/lib/phone";
import type { BookingDetail } from "@/services/bookings/types";

function Action({
	href,
	icon,
	children,
	external,
}: {
	href: string;
	icon: ReactNode;
	children: ReactNode;
	external?: boolean;
}) {
	return (
		<Button
			asChild
			variant="outline"
			size="sm"
			className="h-8 justify-start gap-2 text-xs"
		>
			<a
				href={href}
				{...(external && { target: "_blank", rel: "noopener noreferrer" })}
			>
				{icon}
				{children}
			</a>
		</Button>
	);
}

/** One-tap ways to reach the client from the request. */
export async function BookingContact({ booking }: { booking: BookingDetail }) {
	const t = await getTranslations("Bookings.contact");
	const format = await getFormatter();
	const phone = booking.clientPhone ? toE164(booking.clientPhone) : null;
	const icon = "h-3.5 w-3.5";

	return (
		<section className="flex flex-col gap-3 self-start rounded-xl border border-border bg-card p-3">
			<h2 className="text-xs font-medium text-muted-foreground">
				{t("title")}
			</h2>
			<div className="flex flex-col gap-1.5">
				{booking.clientId && (
					<Action
						href={`/dashboard/messages?client=${booking.clientId}`}
						icon={<MessageSquare className={icon} />}
					>
						{t("message")}
					</Action>
				)}
				{phone && (
					<>
						<Action href={`tel:${phone}`} icon={<Phone className={icon} />}>
							{t("call")} · {formatPhone(phone)}
						</Action>
						<Action
							external
							href={`https://wa.me/${phone.replace(/\D/g, "")}`}
							icon={<MessageCircle className={icon} />}
						>
							{t("whatsapp")}
						</Action>
					</>
				)}
				{booking.clientEmail && (
					<Action
						href={`mailto:${booking.clientEmail}`}
						icon={<Mail className={icon} />}
					>
						{t("email")}
					</Action>
				)}
				{booking.clientId && (
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="h-8 justify-start gap-2 text-xs"
					>
						<Link href={`/dashboard/clients/${booking.clientId}`}>
							<UserRound className={icon} />
							{t("profile")}
						</Link>
					</Button>
				)}
				{!phone && !booking.clientEmail && (
					<p className="text-xs text-muted-foreground">{t("none")}</p>
				)}
			</div>
			<p className="text-[11px] text-muted-foreground">
				{t("received", {
					date: format.dateTime(new Date(booking.createdAt), {
						dateStyle: "medium",
					}),
				})}
			</p>
		</section>
	);
}
