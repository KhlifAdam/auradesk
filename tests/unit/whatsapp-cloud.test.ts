import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { BETTER_AUTH_URL: "https://app.test/" } }));

const { cloudConfigured, sendCloudTemplate } = await import(
	"@/lib/whatsapp/cloud/cloud-client"
);

const fetchMock = vi.fn();

/** The JSON the last call sent to Meta. */
const sent = () => JSON.parse(fetchMock.mock.calls.at(-1)?.[1].body);

beforeEach(() => {
	vi.stubGlobal("fetch", fetchMock);
	vi.spyOn(console, "error").mockImplementation(() => {});
	fetchMock.mockReset().mockResolvedValue(new Response("{}", { status: 200 }));
	process.env.WHATSAPP_CLOUD_TOKEN = "token";
	process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID = "1234";
	process.env.WHATSAPP_CLOUD_API_VERSION = "";
});

afterEach(() => vi.unstubAllGlobals());

describe("WhatsApp Cloud API", () => {
	it("is set up only with a token and a number", () => {
		expect(cloudConfigured()).toBe(true);
		delete process.env.WHATSAPP_CLOUD_TOKEN;
		expect(cloudConfigured()).toBe(false);
	});

	it("sends a sign-in code as the authentication template", async () => {
		const outcome = await sendCloudTemplate("+21620123456", "otp", "fr", {
			code: "123456",
			minutes: "10",
		});
		expect(outcome).toBe("sent");
		expect(fetchMock.mock.calls[0][0]).toBe(
			"https://graph.facebook.com/v23.0/1234/messages",
		);
		expect(sent()).toEqual({
			messaging_product: "whatsapp",
			to: "21620123456",
			type: "template",
			template: {
				name: "auradesk_otp",
				language: { code: "fr" },
				components: [
					{ type: "body", parameters: [{ type: "text", text: "123456" }] },
					{
						type: "button",
						sub_type: "url",
						index: "0",
						parameters: [{ type: "text", text: "123456" }],
					},
				],
			},
		});
	});

	it("fills a notice's named variables and puts the link's path in the button", async () => {
		await sendCloudTemplate("+21620123456", "galleryShared", "en", {
			studio: "Lumière",
			gallery: "Ceremony",
			url: "https://app.test/portal/galleries/g1",
		});
		const { name, components } = sent().template;
		expect(name).toBe("auradesk_gallery_shared");
		expect(components[0].parameters).toEqual([
			{ type: "text", text: "Lumière", parameter_name: "studio" },
			{ type: "text", text: "Ceremony", parameter_name: "gallery" },
		]);
		expect(components[1].parameters).toEqual([
			{ type: "text", text: "portal/galleries/g1" },
		]);
	});

	it("tells a number without WhatsApp from other refusals", async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({ error: { code: 131026 } }, { status: 400 }),
		);
		expect(await sendCloudTemplate("+1", "otp", "en", { code: "1" })).toBe(
			"not-on-whatsapp",
		);
		fetchMock.mockResolvedValueOnce(
			Response.json({ error: { code: 190 } }, { status: 401 }),
		);
		expect(await sendCloudTemplate("+1", "otp", "en", { code: "1" })).toBe(
			"not-connected",
		);
	});
});
