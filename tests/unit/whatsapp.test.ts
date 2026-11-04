import { beforeEach, describe, expect, it, vi } from "vitest";

// No gateway, database or emails: each is replaced by a stand-in.
const gateway = vi.hoisted(() => ({ sendWhatsappText: vi.fn() }));
const store = vi.hoisted(() => ({
	row: null as null | { status: string; phoneNumber: string | null; alertedAt: Date | null },
}));
const alert = vi.hoisted(() => ({ sendWhatsappAlert: vi.fn() }));

vi.mock("@/lib/whatsapp/gateway-client", () => gateway);
vi.mock("@/lib/whatsapp/send-admin-alert", () => alert);
vi.mock("@/lib/db", () => ({
	db: {
		whatsappConnection: {
			findUnique: async () => store.row,
			upsert: async ({ create, update }: { create: never; update: never }) => {
				store.row = store.row ? { ...store.row, ...(update as object) } : create;
			},
		},
	},
}));

const { sendSms } = await import("@/lib/sms/send-sms");
const { recordStatus } = await import("@/lib/whatsapp/connection-status");

const message = { to: "+21620123456", body: "AuraDesk: your code is 123456." };

beforeEach(() => {
	vi.clearAllMocks();
	vi.spyOn(console, "info").mockImplementation(() => {});
	vi.spyOn(console, "error").mockImplementation(() => {});
	alert.sendWhatsappAlert.mockResolvedValue(undefined);
	store.row = { status: "CONNECTED", phoneNumber: "+21650000000", alertedAt: null };
	process.env.SMS_PROVIDER = "whatsapp";
	delete process.env.SMS_FALLBACK_PROVIDER;
});

describe("sendSms over WhatsApp", () => {
	it("sends nothing else when WhatsApp delivers", async () => {
		gateway.sendWhatsappText.mockResolvedValue("sent");
		await sendSms(message);
		expect(console.info).not.toHaveBeenCalled();
		expect(store.row?.status).toBe("CONNECTED");
	});

	it("falls back when it isn't connected, leaving the status to the gateway", async () => {
		gateway.sendWhatsappText.mockResolvedValue("not-connected");
		await sendSms(message);
		expect(console.info).toHaveBeenCalledWith(
			expect.stringContaining(message.body),
		);
		expect(store.row?.status).toBe("CONNECTED");
	});

	it("falls back without blaming the link for a number with no WhatsApp", async () => {
		gateway.sendWhatsappText.mockResolvedValue("not-on-whatsapp");
		await sendSms(message);
		expect(console.info).toHaveBeenCalled();
		expect(store.row?.status).toBe("CONNECTED");
		expect(alert.sendWhatsappAlert).not.toHaveBeenCalled();
	});

	it("falls back when the gateway can't be reached", async () => {
		gateway.sendWhatsappText.mockRejectedValue(new Error("ECONNREFUSED"));
		await sendSms(message);
		expect(console.info).toHaveBeenCalled();
		expect(store.row?.status).toBe("DOWN");
	});

	it("keeps a logged-out link logged out when the gateway is unreachable", async () => {
		store.row = { status: "LOGGED_OUT", phoneNumber: null, alertedAt: new Date() };
		gateway.sendWhatsappText.mockRejectedValue(new Error("ECONNREFUSED"));
		await sendSms(message);
		expect(console.info).toHaveBeenCalled();
		expect(store.row?.status).toBe("LOGGED_OUT");
	});
});

describe("recordStatus", () => {
	it("emails the admins once per outage", async () => {
		await recordStatus("DOWN");
		await recordStatus("DOWN");
		await recordStatus("LOGGED_OUT");
		expect(alert.sendWhatsappAlert).toHaveBeenCalledTimes(1);
		expect(alert.sendWhatsappAlert).toHaveBeenCalledWith("DOWN", "+21650000000");
	});

	it("alerts again after the link came back and dropped", async () => {
		await recordStatus("LOGGED_OUT");
		await recordStatus("CONNECTED", { phone: "+21650000000" });
		await recordStatus("LOGGED_OUT");
		expect(alert.sendWhatsappAlert).toHaveBeenCalledTimes(2);
	});

	it("stays quiet when an admin unlinks on purpose", async () => {
		await recordStatus("LOGGED_OUT", { silent: true });
		await recordStatus("LOGGED_OUT");
		expect(alert.sendWhatsappAlert).not.toHaveBeenCalled();
		expect(store.row?.status).toBe("LOGGED_OUT");
	});
});
