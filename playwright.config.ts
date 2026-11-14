import { defineConfig } from "@playwright/test";

// End-to-end tests: the running app in a real browser. They only read, so
// they are safe against the dev database. Start `pnpm dev` first, or set
// E2E_BASE_URL to test another deployment.
export default defineConfig({
	testDir: "./tests/e2e",
	timeout: 60_000,
	expect: { timeout: 15_000 },
	fullyParallel: true,
	reporter: [["list"]],
	use: {
		baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
		// The installed Chrome, so no browser download is needed.
		channel: "chrome",
		locale: "en-US",
		trace: "retain-on-failure",
	},
});
