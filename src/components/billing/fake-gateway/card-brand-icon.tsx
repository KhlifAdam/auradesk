import { CARD_BRANDS, type CardBrandId } from "@/lib/payments/card-brands";
import { cn } from "@/lib/utils";

/** Each network's mark, drawn small on a card-shaped badge. */
const MARKS: Record<CardBrandId, React.ReactNode> = {
	visa: (
		<text
			x="16"
			y="14"
			textAnchor="middle"
			fontSize="10"
			fontWeight="800"
			fontStyle="italic"
			fill="#1a1f71"
			fontFamily="Arial, sans-serif"
		>
			VISA
		</text>
	),
	mastercard: (
		<>
			<circle cx="12.5" cy="10" r="6" fill="#eb001b" />
			<circle cx="19.5" cy="10" r="6" fill="#f79e1b" />
			<path d="M16 5.1a6 6 0 0 1 0 9.8 6 6 0 0 1 0-9.8z" fill="#ff5f00" />
		</>
	),
	maestro: (
		<>
			<circle cx="12.5" cy="10" r="6" fill="#eb001b" />
			<circle cx="19.5" cy="10" r="6" fill="#00a2e5" />
			<path d="M16 5.1a6 6 0 0 1 0 9.8 6 6 0 0 1 0-9.8z" fill="#7375cf" />
		</>
	),
	amex: (
		<>
			<rect x="1" y="1" width="30" height="18" rx="2" fill="#2e77bc" />
			<text
				x="16"
				y="13.5"
				textAnchor="middle"
				fontSize="7.5"
				fontWeight="800"
				fill="#fff"
				fontFamily="Arial, sans-serif"
			>
				AMEX
			</text>
		</>
	),
	discover: (
		<>
			<text
				x="13"
				y="12.5"
				textAnchor="middle"
				fontSize="5.5"
				fontWeight="700"
				fill="#231f20"
				fontFamily="Arial, sans-serif"
			>
				DISCOVER
			</text>
			<circle cx="27" cy="10.5" r="2.5" fill="#f48120" />
		</>
	),
	diners: (
		<>
			<circle cx="16" cy="10" r="6.5" fill="#0079be" />
			<circle cx="14" cy="10" r="3.6" fill="#fff" />
			<circle cx="18" cy="10" r="3.6" fill="#fff" />
		</>
	),
	jcb: (
		<>
			<rect x="5" y="4" width="7" height="12" rx="2" fill="#0e4c96" />
			<rect x="12.5" y="4" width="7" height="12" rx="2" fill="#e21836" />
			<rect x="20" y="4" width="7" height="12" rx="2" fill="#00a14b" />
			<text
				x="16"
				y="12.5"
				textAnchor="middle"
				fontSize="6"
				fontWeight="800"
				fill="#fff"
				fontFamily="Arial, sans-serif"
				letterSpacing="2.2"
			>
				JCB
			</text>
		</>
	),
	unionpay: (
		<>
			<path d="M6 4h7l-3 12H3z" fill="#e21836" />
			<path d="M12 4h7l-3 12H9z" fill="#00447c" />
			<path d="M18 4h9l-3 12h-9z" fill="#007b84" />
			<text
				x="18"
				y="12.5"
				textAnchor="middle"
				fontSize="5.5"
				fontWeight="800"
				fill="#fff"
				fontFamily="Arial, sans-serif"
			>
				UP
			</text>
		</>
	),
};

/** A card network's logo, 32×20, the way checkout pages list them. */
export function CardBrandIcon({
	brand,
	className,
}: {
	brand: CardBrandId;
	className?: string;
}) {
	const name = CARD_BRANDS.find((b) => b.id === brand)?.name ?? brand;
	return (
		<svg
			viewBox="0 0 32 20"
			role="img"
			aria-label={name}
			className={cn("h-5 w-8 shrink-0", className)}
		>
			<title>{name}</title>
			<rect
				x="0.5"
				y="0.5"
				width="31"
				height="19"
				rx="2.5"
				fill="#fff"
				stroke="#e5e7eb"
			/>
			{MARKS[brand]}
		</svg>
	);
}
