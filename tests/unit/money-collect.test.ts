import { describe, expect, it } from "vitest";
import {
	type CollectItem,
	invoiceGross,
	invoiceReason,
	projectReason,
	projectRemainder,
	rankToCollect,
} from "@/lib/money/collect";
import { clientNextStep } from "@/lib/projects/client-next-step";

const today = new Date("2026-10-26T09:00:00Z");
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("money to collect", () => {
	it("counts a project without invoices as its price minus the advance", () => {
		expect(
			projectRemainder({
				price: 1000,
				advance: 300,
				invoicedGross: 0,
				hasIssuedInvoices: false,
			}),
		).toBe(700);
	});

	it("keeps the part of a price not invoiced yet", () => {
		// A 300 deposit invoice on a 1,000 project: 700 is still to bill.
		expect(
			projectRemainder({
				price: 1000,
				advance: 100,
				invoicedGross: 300,
				hasIssuedInvoices: true,
			}),
		).toBe(700);
	});

	it("compares a price with tax to what invoices bill with tax", () => {
		// Price 773.5 = 650 + 19% tax, billed by one invoice: nothing left.
		expect(invoiceGross(650, 19)).toBe(773.5);
		expect(
			projectRemainder({
				price: 773.5,
				advance: 0,
				invoicedGross: invoiceGross(650, 19),
				hasIssuedInvoices: true,
			}),
		).toBe(0);
	});

	it("leaves nothing on a fully invoiced project, discount or not", () => {
		// Billed 1,000 with a 100 discount: the invoice owes 900, the project 0.
		expect(
			projectRemainder({
				price: 1000,
				advance: 0,
				invoicedGross: 1000,
				hasIssuedInvoices: true,
			}),
		).toBe(0);
		expect(
			projectRemainder({
				price: 1000,
				advance: 0,
				invoicedGross: 1200,
				hasIssuedInvoices: true,
			}),
		).toBe(0);
	});

	it("reads an invoice's urgency", () => {
		expect(invoiceReason(day("2026-10-20"), null, today)).toEqual({
			reason: "overdue",
			days: 6,
		});
		expect(invoiceReason(day("2026-10-29"), null, today)).toEqual({
			reason: "dueSoon",
			days: 3,
		});
		expect(invoiceReason(null, { status: "READY" }, today).reason).toBe(
			"readyUnpaid",
		);
		expect(invoiceReason(null, { status: "DELIVERED" }, today).reason).toBe(
			"deliveredUnpaid",
		);
	});

	it("reads a project's urgency", () => {
		expect(projectReason("DELIVERY", null, today).reason).toBe(
			"deliveredUnpaid",
		);
		expect(projectReason("COMPLETED", null, today).reason).toBe(
			"deliveredUnpaid",
		);
		expect(projectReason("EXPORT", null, today).reason).toBe(
			"deliveringSoon",
		);
		expect(projectReason("PREP", day("2026-10-28"), today)).toEqual({
			reason: "dueSoon",
			days: 2,
		});
	});

	it("chases the most pressing first, then the biggest", () => {
		const item = (id: string, patch: Partial<CollectItem>): CollectItem => ({
			kind: "invoice",
			id,
			label: id,
			detail: "",
			clientName: "",
			amount: 100,
			reason: "open",
			days: null,
			href: "",
			...patch,
		});
		const ranked = rankToCollect([
			item("open-big", { amount: 900 }),
			item("late-1", { reason: "overdue", days: 1 }),
			item("late-9", { reason: "overdue", days: 9 }),
			item("ready", { reason: "readyUnpaid" }),
		]);
		expect(ranked.map((i) => i.id)).toEqual([
			"late-9",
			"late-1",
			"ready",
			"open-big",
		]);
	});
});

describe("client next step", () => {
	const project = {
		stage: "SELECTION",
		delivered: false,
		price: 500,
		paymentStatus: "PARTIAL",
		galleries: [{ id: "g1", kind: "PROOFS", submitted: false }],
	};

	it("asks to choose photos during selection", () => {
		expect(clientNextStep(project, [])).toEqual({
			step: "chooseFiles",
			targetId: "g1",
		});
	});

	it("puts an unpaid invoice first", () => {
		expect(
			clientNextStep(project, [{ id: "i1", status: "SENT", balance: 50 }]),
		).toEqual({ step: "payBalance", targetId: "i1" });
	});

	it("points to the files once delivered", () => {
		expect(
			clientNextStep(
				{
					...project,
					delivered: true,
					galleries: [{ id: "f1", kind: "FINAL", submitted: false }],
				},
				[],
			),
		).toEqual({ step: "downloadFiles", targetId: "f1" });
	});

	it("waits for the shoot before it happens", () => {
		expect(clientNextStep({ ...project, stage: "PREP" }, []).step).toBe(
			"waitShoot",
		);
	});
});
