import { describe, expect, it } from "vitest";
import { deletedEmail, phoneEmail, realEmail } from "@/lib/phone";
import {
	accountFieldsSchema,
	setRoleSchema,
} from "@/services/admin/schemas";

describe("admin: account fields", () => {
	it("accepts a name with an email, a phone number, or both", () => {
		for (const values of [
			{ name: "Sami", email: "sami@example.com", phone: "" },
			{ name: "Sami", email: "", phone: "20 123 456" },
			{ name: "Sami", email: "sami@example.com", phone: "+216 20 123 456" },
		])
			expect(accountFieldsSchema.safeParse(values).success).toBe(true);
	});

	it("needs a way to sign in: an email or a phone number", () => {
		const result = accountFieldsSchema.safeParse({
			name: "Sami",
			email: "",
			phone: "",
		});
		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.path).toEqual(["email"]);
	});

	it("refuses an empty name, a bad email or a bad number", () => {
		const base = { name: "Sami", email: "sami@example.com", phone: "" };
		expect(accountFieldsSchema.safeParse({ ...base, name: " " }).success).toBe(false);
		expect(accountFieldsSchema.safeParse({ ...base, email: "nope" }).success).toBe(false);
		expect(accountFieldsSchema.safeParse({ ...base, phone: "12" }).success).toBe(false);
	});
});

describe("admin: roles", () => {
	it("gives photographer, client and team member, never admin", () => {
		for (const role of ["photographer", "client", "team"])
			expect(setRoleSchema.safeParse({ userId: "u1", role }).success).toBe(true);
		expect(setRoleSchema.safeParse({ userId: "u1", role: "admin" }).success).toBe(false);
	});
});

describe("placeholder addresses", () => {
	it("are never shown: phone-only and deleted accounts", () => {
		expect(realEmail(phoneEmail("+21620123456"))).toBeNull();
		expect(realEmail(deletedEmail("u1"))).toBeNull();
		expect(realEmail("sami@example.com")).toBe("sami@example.com");
	});
});
