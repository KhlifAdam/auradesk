import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const path = (relative: string) =>
	fileURLToPath(new URL(relative, import.meta.url));

// Unit tests: the app's logic, without a browser, database or storage.
export default defineConfig({
	resolve: {
		alias: {
			"@": path("./src"),
			// The real package throws outside Next's server: a no-op stands in.
			"server-only": path("./tests/support/server-only.ts"),
		},
	},
	test: {
		include: ["tests/unit/**/*.test.ts"],
		environment: "node",
	},
});
