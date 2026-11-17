import { beforeEach, describe, expect, it, vi } from "vitest";

// No gateway, Meta, database or emails: each is replaced by a stand-in.
const gateway = vi.hoisted(() => ({ sendWhatsappText: vi.fn() }));
const cloud = vi.hoisted(() => ({
	cloudConfigured: vi.fn(),
	sendCloudTemplate: vi.fn(),
}));
const store = vi.hoisted(() => ({
	row: null as null | { status: string; phoneNumber: string | null; alertedAt: Date | null },
	routes: new Map<string, string>(),
}));
const alert = vi.hoisted(() => ({ sendWhatsappAlert: vi.fn() }));

vi.mock("@/lib/whatsapp/gateway-client", () => gateway);
vi.mock("@/lib/whatsapp/cloud/cloud-client", () => cloud);
vi.mock("@/lib/whatsapp/send-admin-alert", () => alert);
vi.mock("@/lib/db", () => ({
	db: {
		whatsappConnection: {
			findUnique: async () => store.row,
			upsert: async ({ create, update }: { create: never; update: never }) => {
				store.row = store.row ? { ...store.row, ...(update as object) } : create;
			},
		},
		whatsappRoute: {
			findUnique: async ({ where }: { where: { kind: string } }) => {
				const channel = store.routes.get(where.kind);
				return channel ? { kind: where.kind, channel } : null;
			},
		},
	},
}));

const { sendSms } = await import("@/lib/sms/send-sms");
const { codeChannel, recordStatus } = await import(
	"@/lib/whatsapp/connection-status"
);

// A notice: the linked number (Baileys) sends it by default.
const message = {
	to: "+21620123456",
	kind: "newMessage" as const,
	locale: "en",
	vars: { sender: "Studio", url: "https://app.test/messages" },
};
const body = "Studio sent you a message on AuraDesk: https://app.test/messages";
// A sign-in code: the official API sends it by default.
const otp = {
	to: "+21620123456",
	kind: "otp" as const,
	locale: "fr",
	vars: { code: "123456", minutes: "10" },
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.spyOn(console, "info").mockImplementation(() => {});
	vi.spyOn(console, "error").mockImplementation(() => {});
	alert.sendWhatsappAlert.mockResolvedValue(undefined);
	cloud.cloudConfigured.mockReturnValue(true);
	store.row = { status: "CONNECTED", phoneNumber: "+21650000000", alertedAt: null };
	store.routes.clear();
	process.env.SMS_PROVIDER = "whatsapp";
	delete process.env.SMS_FALLBACK_PROVIDER;
});

describe("sendSms over WhatsApp", () => {
	it("sends nothing else when WhatsApp delivers", async () => {
		gateway.sendWhatsappText.mockResolvedValue("sent");
		await sendSms(message);
		expect(gateway.sendWhatsappText).toHaveBeenCalledWith(message.to, body);
		expect(cloud.sendCloudTemplate).not.toHaveBeenCalled();
		expect(console.info).not.toHaveBeenCalled();
		expect(store.row?.status).toBe("CONNECTED");
	});

	it("falls back when it isn't connected, leaving the status to the gateway", async () => {
		gateway.sendWhatsappText.mockResolvedValue("not-connected");
		await sendSms(message);
		expect(console.info).toHaveBeenCalledWith(expect.stringContaining(body));
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

describe("routing between the linked number and the official API", () => {
	it("sends sign-in codes through the official API by default", async () => {
		cloud.sendCloudTemplate.mockResolvedValue("sent");
		await sendSms(otp);
		expect(cloud.sendCloudTemplate).toHaveBeenCalledWith(
			otp.to,
			"otp",
			"fr",
			otp.vars,
		);
		expect(gateway.sendWhatsappText).not.toHaveBeenCalled();
		expect(console.info).not.toHaveBeenCalled();
	});

	it("goes straight to SMS when the official API refuses", async () => {
		cloud.sendCloudTemplate.mockResolvedValue("not-connected");
		await sendSms(otp);
		expect(gateway.sendWhatsappText).not.toHaveBeenCalled();
		expect(console.info).toHaveBeenCalledWith(expect.stringContaining("123456"));
	});

	it("goes straight to SMS when Meta can't be reached", async () => {
		cloud.sendCloudTemplate.mockRejectedValue(new Error("timeout"));
		await sendSms(otp);
		expect(console.info).toHaveBeenCalledWith(expect.stringContaining("123456"));
	});

	it("goes straight to SMS when the official API isn't set up", async () => {
		cloud.cloudConfigured.mockReturnValue(false);
		await sendSms(otp);
		expect(cloud.sendCloudTemplate).not.toHaveBeenCalled();
		expect(console.info).toHaveBeenCalled();
	});

	it("follows the channel an admin chose", async () => {
		store.routes.set("otp", "BAILEYS");
		store.routes.set("newMessage", "CLOUD");
		gateway.sendWhatsappText.mockResolvedValue("sent");
		cloud.sendCloudTemplate.mockResolvedValue("sent");
		await sendSms(otp);
		await sendSms(message);
		expect(gateway.sendWhatsappText).toHaveBeenCalledTimes(1);
		expect(gateway.sendWhatsappText).toHaveBeenCalledWith(
			otp.to,
			expect.stringContaining("123456"),
		);
		expect(cloud.sendCloudTemplate).toHaveBeenCalledTimes(1);
		expect(cloud.sendCloudTemplate).toHaveBeenCalledWith(
			message.to,
			"newMessage",
			"en",
			message.vars,
		);
	});
});

describe("codeChannel", () => {
	it("says WhatsApp when codes use the official API and it is set up", async () => {
		store.row = { status: "LOGGED_OUT", phoneNumber: null, alertedAt: null };
		expect(await codeChannel()).toBe("whatsapp");
		cloud.cloudConfigured.mockReturnValue(false);
		expect(await codeChannel()).toBe("sms");
	});

	it("follows the linked number when codes use it", async () => {
		store.routes.set("otp", "BAILEYS");
		expect(await codeChannel()).toBe("whatsapp");
		store.row = { status: "DOWN", phoneNumber: null, alertedAt: null };
		expect(await codeChannel()).toBe("sms");
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
