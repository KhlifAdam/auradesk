import { describe, expect, it } from "vitest";
import { PROJECT_STAGES } from "@/services/projects/stages";
import {
	canClientView,
	isDeliveredToClient,
} from "@/services/projects/visibility";

describe("canClientView", () => {
	it("opens shared galleries from the Selection stage on", () => {
		const open = PROJECT_STAGES.filter((stage) => canClientView({ stage }));
		expect(open[0]).toBe("SELECTION");
		expect(open).not.toContain("IMPORT");
		expect(open).toContain("DELIVERY");
	});
});

describe("isDeliveredToClient", () => {
	it("needs both delivery and payment", () => {
		expect(isDeliveredToClient({ stage: "DELIVERY", paymentStatus: "PAID" })).toBe(true);
		expect(isDeliveredToClient({ stage: "DELIVERY", paymentStatus: "PARTIAL" })).toBe(false);
		expect(isDeliveredToClient({ stage: "VALIDATION", paymentStatus: "PAID" })).toBe(false);
	});
});
