import { describe, expect, it } from "vitest";
import { detectCardBrand, formatCardNumber } from "@/lib/payments/card-brands";
import {
	cardSchema,
	cleanHolder,
	cleanName,
	DECLINED_TEST_CARD,
	isFutureExpiry,
	passesLuhn,
	typeCardNumber,
	typeExpiry,
	typePhone,
} from "@/lib/payments/gateway-forms";
import { fromMillimes, toMillimes } from "@/lib/payments/types";
import { nextPeriod } from "@/services/billing/period";
import {
	type BillingState,
	canRenewNow,
	type PlanChoice,
	planChange,
	prorate,
	renewalPlan,
} from "@/services/billing/plan-change";
import { pricePerPeriod } from "@/services/billing/plans";

const now = new Date("2026-11-19T12:00:00");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

describe("nextPeriod", () => {
	it("starts after the free month while it runs", () => {
		const { periodStart, periodEnd } = nextPeriod(
			{ trialEndsAt: days(10), paidUntil: null },
			"MONTHLY",
			now,
		);
		expect(periodStart).toEqual(days(10));
		expect(periodEnd.getMonth()).toBe((days(10).getMonth() + 1) % 12);
	});

	it("starts after the paid period, so no paid day is lost", () => {
		const paidUntil = days(5);
		const { periodStart } = nextPeriod(
			{ trialEndsAt: days(-30), paidUntil },
			"MONTHLY",
			now,
		);
		expect(periodStart).toEqual(paidUntil);
	});

	it("starts now once everything is over, for a year on yearly billing", () => {
		const { periodStart, periodEnd } = nextPeriod(
			{ trialEndsAt: days(-60), paidUntil: days(-20) },
			"YEARLY",
			now,
		);
		expect(periodStart).toEqual(now);
		expect(periodEnd.getFullYear()).toBe(now.getFullYear() + 1);
		expect(periodEnd.getMonth()).toBe(now.getMonth());
	});
});

describe("millimes", () => {
	it("converts dinars both ways without float noise", () => {
		expect(toMillimes(59)).toBe(59_000);
		expect(toMillimes(0.1 + 0.2)).toBe(300);
		expect(fromMillimes(toMillimes(566.4))).toBe(566.4);
	});

	it("charges the price list's amount for a period", () => {
		expect(toMillimes(pricePerPeriod("PRO", "MONTHLY"))).toBe(59_000);
		expect(toMillimes(pricePerPeriod("PRO", "YEARLY"))).toBe(47 * 12 * 1000);
	});
});

describe("fake gateway card checks", () => {
	it("accepts valid test numbers and rejects typos", () => {
		expect(passesLuhn("4242424242424242")).toBe(true);
		expect(passesLuhn(DECLINED_TEST_CARD)).toBe(true);
		expect(passesLuhn("4242424242424241")).toBe(false);
	});

	it("only accepts an expiry that hasn't passed", () => {
		expect(isFutureExpiry("1126", now)).toBe(true);
		expect(isFutureExpiry("1026", now)).toBe(false);
		expect(isFutureExpiry("1330", now)).toBe(false);
	});

	it("asks E-Dinar cards for 16 digits", () => {
		const card = { holder: "Ali Ben Salah", expiry: "1230", cvv: "1234" };
		const amex = "378282246310005";
		expect(cardSchema("bankCard").safeParse({ ...card, number: amex }).success).toBe(true);
		expect(cardSchema("eDinar").safeParse({ ...card, number: amex }).success).toBe(false);
	});

	it("reports each bad field with its validation key", () => {
		const result = cardSchema("bankCard").safeParse({
			holder: "A",
			number: "4242424242424241",
			expiry: "0120",
			cvv: "12",
		});
		const codes = result.error?.issues.map((issue) => issue.message).sort();
		expect(codes).toEqual(["cardCvv", "cardExpiry", "cardHolder", "cardNumber"]);
	});
});

describe("card networks", () => {
	it("tells the network from the first digits", () => {
		expect(detectCardBrand("4242")?.id).toBe("visa");
		expect(detectCardBrand("5555")?.id).toBe("mastercard");
		expect(detectCardBrand("2223")?.id).toBe("mastercard");
		expect(detectCardBrand("3782")?.id).toBe("amex");
		expect(detectCardBrand("6011")?.id).toBe("discover");
		expect(detectCardBrand("6759")?.id).toBe("maestro");
		expect(detectCardBrand("1234")).toBeNull();
	});

	it("groups American Express as 4-6-5", () => {
		expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005");
		expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
	});
});

describe("card form typing rules", () => {
	it("refuses a number no network issues, but always lets you delete", () => {
		expect(typeCardNumber("1", "", "bankCard")).toBe("");
		expect(typeCardNumber("4", "", "bankCard")).toBe("4");
		expect(typeCardNumber("1", "51", "bankCard")).toBe("1");
	});

	it("stops at the network's length", () => {
		expect(typeCardNumber("3782822463100059", "378282246310005", "bankCard")).toBe(
			"378282246310005",
		);
		expect(typeCardNumber("42424242424242424", "", "eDinar")).toHaveLength(16);
	});

	it("only takes real months and years still to come", () => {
		expect(typeExpiry("4", "", now)).toBe("04");
		expect(typeExpiry("13", "1", now)).toBe("1");
		expect(typeExpiry("00", "0", now)).toBe("0");
		expect(typeExpiry("121", "12", now)).toBe("12");
		expect(typeExpiry("1225", "122", now)).toBe("122");
		expect(typeExpiry("1230", "123", now)).toBe("1230");
	});

	it("keeps phone numbers Tunisian and names free of digits", () => {
		expect(typePhone("1", "")).toBe("");
		expect(typePhone("98 123", "9812")).toBe("98123");
		expect(cleanName("Ali2  Ben-Salah!")).toBe("Ali Ben-Salah");
		expect(cleanHolder("ali ben salah")).toBe("ALI BEN SALAH");
	});

	it("asks American Express for a 4-digit CVV", () => {
		const card = { holder: "ALI", expiry: "1230" };
		const amex = "378282246310005";
		expect(cardSchema("bankCard").safeParse({ ...card, number: amex, cvv: "123" }).success).toBe(false);
		expect(cardSchema("bankCard").safeParse({ ...card, number: amex, cvv: "1234" }).success).toBe(true);
	});
});

describe("plan changes", () => {
	const paid = (overrides: Partial<BillingState> = {}): BillingState => ({
		status: "active",
		plan: "PRO",
		cycle: "MONTHLY",
		storagePacks: 0,
		trialEndsAt: days(-40),
		paidUntil: days(20),
		endsAt: days(20),
		scheduledPlan: null,
		scheduledCycle: null,
		scheduledStoragePacks: null,
		...overrides,
	});
	const choice = (plan: PlanChoice["plan"], cycle: PlanChoice["cycle"] = "MONTHLY", storagePacks = 0) => ({
		plan,
		cycle,
		storagePacks,
	});

	it("only lets a paid plan renew in its last days", () => {
		expect(canRenewNow(paid(), now)).toBe(false);
		expect(canRenewNow(paid({ endsAt: days(5) }), now)).toBe(true);
		expect(canRenewNow({ status: "expired", endsAt: null }, now)).toBe(true);
	});

	it("has nothing to pay for the plan already paid", () => {
		expect(planChange(paid(), choice("PRO"), now).kind).toBe("current");
	});

	it("charges an upgrade only for the days left", () => {
		const change = planChange(paid(), choice("STUDIO"), now);
		expect(change.kind).toBe("upgrade");
		// 70 DT more a month, 20 days of ~30.44 left: about 46 DT.
		if (change.kind === "upgrade") {
			expect(change.amount).toBeGreaterThan(45);
			expect(change.amount).toBeLessThan(47);
			expect(change.until).toEqual(days(20));
		}
		expect(planChange(paid(), choice("PRO", "MONTHLY", 1), now).kind).toBe("upgrade");
	});

	it("leaves cheaper plans and billing switches for the renewal", () => {
		expect(planChange(paid(), choice("STARTER"), now)).toEqual({ kind: "scheduled", from: days(20) });
		expect(planChange(paid(), choice("STUDIO", "YEARLY"), now).kind).toBe("scheduled");
	});

	it("bills the scheduled change at renewal", () => {
		const state = paid({ scheduledPlan: "STARTER", scheduledCycle: "YEARLY", scheduledStoragePacks: 0 });
		expect(renewalPlan(state)).toEqual(choice("STARTER", "YEARLY"));
		expect(renewalPlan(paid())).toEqual(choice("PRO"));
	});

	it("subscribes for a full period during the free month or once ended", () => {
		const trial = paid({ status: "trial", paidUntil: null, trialEndsAt: days(10), endsAt: days(10) });
		expect(planChange(trial, choice("STARTER"), now)).toEqual({ kind: "subscribe", amount: 29, startsAt: days(10) });
		const ended = paid({ status: "expired", paidUntil: days(-3), endsAt: null });
		expect(planChange(ended, choice("PRO", "YEARLY"), now)).toMatchObject({ kind: "subscribe", amount: 47 * 12 });
	});

	it("doesn't charge an upgrade for days still in the free month", () => {
		const change = planChange(paid({ trialEndsAt: days(10), paidUntil: days(40), endsAt: days(40) }), choice("STUDIO"), now);
		// Only the 30 paid days count: about one month's difference (70 DT).
		expect(change).toMatchObject({ kind: "upgrade", days: 30 });
		if (change.kind === "upgrade") expect(change.amount).toBeLessThan(70);
	});

	it("never charges less than 1 DT for an upgrade", () => {
		expect(prorate(10, "MONTHLY", 60_000)).toBe(1);
	});
});
