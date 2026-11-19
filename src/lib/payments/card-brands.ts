/**
 * Card networks, told apart by the first digits of the number (the IIN
 * ranges the networks publish). Used by the gateway's card form to show
 * the card's logo, format the number and know how long it and its CVV are.
 */
export type CardBrandId =
	| "visa"
	| "mastercard"
	| "amex"
	| "discover"
	| "diners"
	| "jcb"
	| "unionpay"
	| "maestro";

export interface CardBrand {
	id: CardBrandId;
	name: string;
	/** Prefixes, single ("4") or a range of equal length ("2221-2720"). */
	prefixes: string[];
	lengths: number[];
	cvvLength: number;
	/** Where spaces go when the number is shown. */
	gaps: number[];
}

const FOURS = [4, 8, 12, 16];

export const CARD_BRANDS: CardBrand[] = [
	{
		id: "visa",
		name: "Visa",
		prefixes: ["4"],
		lengths: [13, 16, 19],
		cvvLength: 3,
		gaps: FOURS,
	},
	{
		id: "mastercard",
		name: "Mastercard",
		prefixes: ["51-55", "2221-2720"],
		lengths: [16],
		cvvLength: 3,
		gaps: FOURS,
	},
	{
		id: "amex",
		name: "American Express",
		prefixes: ["34", "37"],
		lengths: [15],
		cvvLength: 4,
		gaps: [4, 10],
	},
	{
		id: "discover",
		name: "Discover",
		prefixes: ["6011", "644-649", "65"],
		lengths: [16, 19],
		cvvLength: 3,
		gaps: FOURS,
	},
	{
		id: "diners",
		name: "Diners Club",
		prefixes: ["300-305", "36", "38-39"],
		lengths: [14, 16, 19],
		cvvLength: 3,
		gaps: [4, 10],
	},
	{
		id: "jcb",
		name: "JCB",
		prefixes: ["3528-3589"],
		lengths: [16, 17, 18, 19],
		cvvLength: 3,
		gaps: FOURS,
	},
	{
		id: "unionpay",
		name: "UnionPay",
		prefixes: ["62"],
		lengths: [16, 17, 18, 19],
		cvvLength: 3,
		gaps: FOURS,
	},
	{
		id: "maestro",
		name: "Maestro",
		prefixes: ["5018", "5020", "5038", "6304", "6759", "6761-6763"],
		lengths: [12, 13, 14, 15, 16, 17, 18, 19],
		cvvLength: 3,
		gaps: FOURS,
	},
];

/** The networks shown as accepted on the card form. */
export const ACCEPTED_BRANDS: CardBrandId[] = ["visa", "mastercard", "amex"];

const bounds = (prefix: string) => {
	const [lo, hi = lo] = prefix.split("-");
	return { lo, hi };
};

/** How many digits of `digits` the prefix matches fully (0 if it doesn't). */
function fullMatch(digits: string, prefix: string) {
	const { lo, hi } = bounds(prefix);
	if (digits.length < lo.length) return 0;
	const head = Number(digits.slice(0, lo.length));
	return head >= Number(lo) && head <= Number(hi) ? lo.length : 0;
}

/** Whether more digits typed after `digits` could still land in the prefix. */
function couldMatch(digits: string, prefix: string) {
	const { lo, hi } = bounds(prefix);
	if (digits.length >= lo.length) return fullMatch(digits, prefix) > 0;
	const k = digits.length;
	const head = Number(digits);
	return head >= Number(lo.slice(0, k)) && head <= Number(hi.slice(0, k));
}

/** The network of a (possibly partial) number; the longest prefix wins. */
export function detectCardBrand(digits: string): CardBrand | null {
	let best: CardBrand | null = null;
	let bestLength = 0;
	for (const brand of CARD_BRANDS)
		for (const prefix of brand.prefixes) {
			const length = fullMatch(digits, prefix);
			if (length > bestLength) {
				best = brand;
				bestLength = length;
			}
		}
	return best;
}

/** False once the digits can't be the start of any accepted card. */
export const isPossibleCardStart = (digits: string) =>
	digits.length === 0 ||
	CARD_BRANDS.some((brand) =>
		brand.prefixes.some((prefix) => couldMatch(digits, prefix)),
	);

/** The longest number the brand (or any card, when unknown) allows. */
export const maxCardLength = (brand: CardBrand | null) =>
	brand ? Math.max(...brand.lengths) : 19;

/** "4242 4242 4242 4242", or "3782 822463 10005" for American Express. */
export function formatCardNumber(digits: string) {
	const gaps = detectCardBrand(digits)?.gaps ?? FOURS;
	let out = "";
	for (let i = 0; i < digits.length; i++) {
		if (gaps.includes(i)) out += " ";
		out += digits[i];
	}
	return out;
}
