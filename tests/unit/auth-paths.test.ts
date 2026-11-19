import { describe, expect, it } from "vitest";
import {
	AUTH_PATHS,
	audienceFromPath,
	CLIENT_AUTH_ROOT,
	verifyEmailPath,
} from "@/lib/auth/client-intent";

// A client screen outside /client renders in the studio's colour and photo.
describe("auth paths", () => {
	const { home: _clientHome, ...clientScreens } = AUTH_PATHS.client;
	const { home: _studioHome, ...studioScreens } = AUTH_PATHS.photographer;

	it.each(Object.entries(clientScreens))("client %s is a client screen", (_, path) => {
		expect(path.startsWith(CLIENT_AUTH_ROOT)).toBe(true);
		expect(audienceFromPath(path)).toBe("client");
	});

	it.each(Object.entries(studioScreens))("studio %s is a studio screen", (_, path) => {
		expect(audienceFromPath(path)).toBe("photographer");
	});

	it("gives each side the same screens", () => {
		const studioKeys = Object.keys(studioScreens);
		for (const key of studioKeys) expect(clientScreens).toHaveProperty(key);
	});

	it("sends each side to its own verify screen", () => {
		expect(audienceFromPath(verifyEmailPath("a@b.co", "client").split("?")[0])).toBe("client");
		expect(audienceFromPath(verifyEmailPath("a@b.co", "photographer").split("?")[0])).toBe(
			"photographer",
		);
	});

	it("does not mistake a lookalike prefix for the client side", () => {
		expect(audienceFromPath("/clients-area")).toBe("photographer");
	});
});
