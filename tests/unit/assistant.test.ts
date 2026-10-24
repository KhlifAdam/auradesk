import { describe, expect, it, vi } from "vitest";
import { buildSystemPrompt } from "@/lib/ai/assistant/system-prompt";
import { buildAssistantTools } from "@/lib/ai/assistant/tools";
import { toAssistantViewer } from "@/lib/ai/assistant/viewer";
import {
	isWriteTool,
	toolOutcome,
	WRITE_TOOLS,
} from "@/lib/ai/assistant/write-tools";

// The tools only touch the database when they run; building them must not.
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/env", () => ({ env: {} }));

const photographer = toAssistantViewer({ id: "p1", role: "photographer" });
const team = toAssistantViewer({ id: "t1", role: "team" });
const ctx = { locale: "en" as const, timeZone: "Africa/Tunis" };

describe("assistant viewer", () => {
	it("gives photographers their own studio and team members their own id", () => {
		expect(photographer).toEqual({
			kind: "photographer",
			userId: "p1",
			photographerId: "p1",
		});
		expect(team).toEqual({ kind: "team", userId: "t1" });
	});

	it("has no assistant for clients, admins or unknown roles", () => {
		for (const role of ["client", "admin", null, "other"])
			expect(toAssistantViewer({ id: "x", role })).toBeNull();
	});
});

describe("assistant tools", () => {
	it("gives team members read-only tools", () => {
		const names = Object.keys(buildAssistantTools(team!, ctx));
		expect(names.length).toBeGreaterThan(0);
		expect(names.filter(isWriteTool)).toEqual([]);
	});

	it("gives photographers every write tool, none with a server execute", () => {
		const tools = buildAssistantTools(photographer!, ctx) as Record<
			string,
			{ execute?: unknown }
		>;
		for (const name of Object.keys(WRITE_TOOLS)) {
			expect(tools[name]).toBeDefined();
			expect(tools[name].execute).toBeUndefined();
		}
	});

	it("puts every deletion behind the red confirmation", () => {
		for (const [name, { tier }] of Object.entries(WRITE_TOOLS))
			if (/^(delete|remove)_/.test(name)) expect(tier).toBe("danger");
	});

	it("never runs anything that notifies a client without a confirmation", () => {
		const auto = Object.entries(WRITE_TOOLS)
			.filter(([, tool]) => tool.tier === "auto")
			.map(([name]) => name);
		expect(auto.sort()).toEqual(
			["add_booking_note", "create_calendar_event", "update_client_notes"].sort(),
		);
	});
});

describe("assistant outcomes", () => {
	it("spells out that a cancel changed nothing", () => {
		expect(toolOutcome.cancelled()).toMatchObject({ status: "cancelled" });
		expect(toolOutcome.cancelled().outcome).toMatch(/nothing/i);
		expect(toolOutcome.failed("boom")).toMatchObject({
			status: "failed",
			error: "boom",
		});
	});
});

describe("assistant system prompt", () => {
	const base = { userName: "Adam", studioName: "Lumière", timeZone: "UTC" };

	it("answers in the user's language", () => {
		expect(buildSystemPrompt({ ...base, viewer: photographer!, locale: "fr" })).toContain(
			"Answer in French",
		);
	});

	it("tells the model a team member can't change anything", () => {
		const prompt = buildSystemPrompt({ ...base, viewer: team!, locale: "en" });
		expect(prompt).toContain("can't change anything");
		expect(prompt).not.toContain("only propose the change");
	});
});
