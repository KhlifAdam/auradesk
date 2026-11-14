import { expect, test } from "@playwright/test";

/** The first published studio in the sitemap, if there is one. */
async function firstStudioPath(request: import("@playwright/test").APIRequestContext) {
	const xml = await (await request.get("/sitemap.xml")).text();
	return xml.match(/<loc>[^<]*?(\/s\/[^<?]+)<\/loc>/)?.[1] ?? null;
}

test.describe("public pages", () => {
	test("the landing page loads", async ({ page }) => {
		const response = await page.goto("/");
		expect(response?.status()).toBe(200);
		await expect(page).toHaveTitle(/AuraDesk/);
	});

	test("the photographers page loads", async ({ page }) => {
		const response = await page.goto("/photographers");
		expect(response?.status()).toBe(200);
		await expect(page.locator("main")).toBeVisible();
	});

	test("an unknown page shows the 404 screen", async ({ page }) => {
		const response = await page.goto("/this-page-does-not-exist");
		expect(response?.status()).toBe(404);
		await expect(page.getByText("404")).toBeVisible();
	});

	test("an unknown studio shows its not-found screen", async ({ page }) => {
		const response = await page.goto("/s/no-such-studio-e2e");
		expect(response?.status()).toBe(404);
	});
});

test.describe("search engines", () => {
	test("robots.txt keeps private spaces out", async ({ request }) => {
		const body = await (await request.get("/robots.txt")).text();
		for (const path of ["/dashboard", "/portal", "/admin", "/team", "/g/"])
			expect(body).toContain(`Disallow: ${path}`);
		expect(body).toContain("/sitemap.xml");
	});

	test("the sitemap lists the public pages", async ({ request }) => {
		const response = await request.get("/sitemap.xml");
		expect(response.status()).toBe(200);
		const xml = await response.text();
		expect(xml).toContain("<urlset");
		expect(xml).toMatch(/<loc>[^<]*\/photographers<\/loc>/);
		expect(xml).not.toMatch(/<loc>[^<]*\/(dashboard|portal|admin)/);
	});

	test("a published studio site has sharing tags", async ({ page, request }) => {
		const path = await firstStudioPath(request);
		test.skip(!path, "no published studio in this database");
		// The head is enough: a showreel or large photos may keep "load" waiting.
		await page.goto(path as string, { waitUntil: "domcontentloaded" });
		await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			"href",
			new RegExp(`${path}$`),
		);
	});
});

test.describe("private spaces", () => {
	for (const path of ["/dashboard", "/portal", "/team", "/admin"]) {
		test(`${path} asks a visitor to sign in`, async ({ page }) => {
			await page.goto(path);
			await expect(page).toHaveURL(/\/(client\/|admin\/)?login/);
		});
	}

	test("the sign-in form refuses an empty submit", async ({ page }) => {
		await page.goto("/login");
		await page.getByRole("button", { name: /sign in|log in/i }).click();
		await expect(page).toHaveURL(/\/login/);
		await expect(page.locator("[aria-invalid='true']").first()).toBeVisible();
	});
});
