import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIENCE_ROLES } from "@/lib/auth/client-intent";
import { clientIntentHooks } from "@/lib/auth/client-intent-hooks";
import { isMainAdminEmail } from "@/lib/auth/main-admin";
import { proxy } from "@/proxy";

const findUser = vi.hoisted(() => vi.fn());

vi.mock("@/lib/env", () => ({ env: { ADMIN_EMAIL: "Auradesk.TN@hotmail.com" } }));
vi.mock("@/lib/db", () => ({
	db: {
		user: { findUnique: findUser },
		project: { findFirst: vi.fn().mockResolvedValue(null) },
		teamMember: { findFirst: vi.fn().mockResolvedValue(null) },
	},
}));

const createUser = clientIntentHooks.user.create.before;
const createSession = clientIntentHooks.session.create.before;
const session = { userId: "u1" } as Parameters<typeof createSession>[0];
const at = (path: string) => ({ path }) as Parameters<typeof createSession>[1];

describe("the main administrator address", () => {
	it("matches whatever the letter case or spacing", () => {
		expect(isMainAdminEmail("auradesk.tn@hotmail.com")).toBe(true);
		expect(isMainAdminEmail("  AURADESK.TN@Hotmail.com ")).toBe(true);
	});

	it("matches no other address", () => {
		expect(isMainAdminEmail("someone@hotmail.com")).toBe(false);
		expect(isMainAdminEmail("")).toBe(false);
		expect(isMainAdminEmail(null)).toBe(false);
	});

	it("can't be signed up from the public pages", async () => {
		const user = { email: "auradesk.tn@hotmail.com" } as Parameters<
			typeof createUser
		>[0];
		expect(await createUser(user, null)).toBe(false);
	});

	it("leaves every other sign-up alone", async () => {
		const user = { email: "new@example.com" } as Parameters<typeof createUser>[0];
		expect(await createUser(user, null)).not.toBe(false);
	});
});

describe("administrator sessions", () => {
	beforeEach(() => findUser.mockReset());

	it("start from the email and password sign-in", async () => {
		findUser.mockResolvedValue({ role: "admin" });
		expect(await createSession(session, at("/sign-in/email"))).toBeUndefined();
	});

	it.each([
		"/callback/google",
		"/sign-in/social",
		"/sign-in/email-otp",
		"/phone-number/verify",
		"/email-otp/verify-email",
	])("never start from %s", async (path) => {
		findUser.mockResolvedValue({ role: "admin" });
		expect(await createSession(session, at(path))).toBe(false);
	});

	it("never start without a request behind them", async () => {
		findUser.mockResolvedValue({ role: "admin" });
		expect(await createSession(session, null)).toBe(false);
	});

	it("leave studios, clients and the team free to sign in any way", async () => {
		for (const role of ["photographer", "client", "team"]) {
			findUser.mockResolvedValue({ role });
			expect(await createSession(session, at("/callback/google"))).toBeUndefined();
		}
	});
});

describe("who signs in where", () => {
	it("keeps administrators off the studios' sign-in page", () => {
		expect(AUDIENCE_ROLES.photographer).not.toContain("admin");
		expect(AUDIENCE_ROLES.client).not.toContain("admin");
	});

	const go = (path: string, cookie?: string) =>
		proxy(
			new NextRequest(`http://localhost${path}`, {
				headers: cookie ? { cookie } : {},
			}),
		);
	const location = (response: Response) =>
		response.headers.get("location")?.replace("http://localhost", "");

	it("sends signed-out visitors to the right sign-in", () => {
		expect(location(go("/admin"))).toBe("/admin/login");
		expect(location(go("/admin/users/abc"))).toBe("/admin/login");
		expect(location(go("/dashboard"))).toBe("/login");
		expect(location(go("/portal"))).toBe("/client/login");
	});

	it("lets anyone open the admin sign-in page itself", () => {
		expect(location(go("/admin/login"))).toBeUndefined();
	});

	it("lets a visitor with a session cookie through (the page checks the role)", () => {
		expect(location(go("/admin", "better-auth.session_token=abc"))).toBeUndefined();
	});
});
