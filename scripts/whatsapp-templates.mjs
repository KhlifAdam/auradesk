// Submits the WhatsApp Cloud API message templates to Meta for review.
//   pnpm wa:templates            (submits the ones missing, in en + fr)
//   pnpm wa:templates --dry-run  (prints what it would send)
// Needs WHATSAPP_CLOUD_TOKEN (with whatsapp_business_management) and
// WHATSAPP_CLOUD_WABA_ID in .env. The link buttons point at BETTER_AUTH_URL,
// so run it with the production URL. Approval usually takes minutes; their
// status shows in Meta Business Manager > WhatsApp Manager > Message templates.

import { existsSync, readFileSync } from "node:fs";
import {
	CLOUD_TEMPLATES,
	LINK_EXAMPLE,
} from "../src/lib/whatsapp/cloud/cloud-templates.ts";

const LANGUAGES = ["en", "fr"];
const dryRun = process.argv.includes("--dry-run");

if (existsSync(".env")) process.loadEnvFile(".env");
const {
	WHATSAPP_CLOUD_TOKEN: token,
	WHATSAPP_CLOUD_WABA_ID: wabaId,
	BETTER_AUTH_URL: appUrl = "",
} = process.env;
const version = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0";
if (!dryRun && (!token || !wabaId)) {
	console.error("Set WHATSAPP_CLOUD_TOKEN and WHATSAPP_CLOUD_WABA_ID in .env.");
	process.exit(1);
}
const base = `${appUrl.replace(/\/+$/, "")}/`;
if (!base.startsWith("https://"))
	console.warn(`Warning: link buttons will point at ${base} (not https).`);

const graph = (path, init) =>
	fetch(`https://graph.facebook.com/${version}/${wabaId}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	}).then(async (response) => {
		const data = await response.json();
		if (!response.ok) throw new Error(JSON.stringify(data.error ?? data));
		return data;
	});

/** `{studio}` (our copy) becomes `{{studio}}` (Meta's named parameters). */
const toMeta = (text) => text.replace(/\{(\w+)\}/g, "{{$1}}");

function payload(kind, template, language) {
	const { name, category } = template;
	if (category === "AUTHENTICATION")
		return {
			name,
			language,
			category,
			components: [
				{ type: "BODY", add_security_recommendation: true },
				{ type: "BUTTONS", buttons: [{ type: "OTP", otp_type: "COPY_CODE" }] },
			],
		};

	const copy = JSON.parse(readFileSync(`messages/${language}.json`, "utf8"))
		.WhatsappTemplates;
	const components = [
		{
			type: "BODY",
			text: toMeta(copy[kind]),
			example: {
				body_text_named_params: Object.entries(template.params).map(
					([param_name, example]) => ({ param_name, example }),
				),
			},
		},
	];
	if (template.link)
		components.push({
			type: "BUTTONS",
			buttons: [
				{
					type: "URL",
					text: copy.button,
					url: `${base}{{1}}`,
					example: [`${base}${LINK_EXAMPLE}`],
				},
			],
		});
	return { name, language, category, parameter_format: "NAMED", components };
}

async function existing() {
	if (dryRun) return new Set();
	const { data } = await graph("/message_templates?fields=name,language&limit=500");
	return new Set(data.map(({ name, language }) => `${name}/${language}`));
}

const known = await existing();
let failed = 0;
for (const [kind, template] of Object.entries(CLOUD_TEMPLATES))
	for (const language of LANGUAGES) {
		const key = `${template.name}/${language}`;
		if (known.has(key)) {
			console.info(`= ${key} (already submitted)`);
			continue;
		}
		const body = payload(kind, template, language);
		if (dryRun) {
			console.info(JSON.stringify(body, null, 2));
			continue;
		}
		try {
			const { status } = await graph("/message_templates", {
				method: "POST",
				body: JSON.stringify(body),
			});
			console.info(`+ ${key}: ${status}`);
		} catch (error) {
			failed++;
			console.error(`! ${key}: ${error.message}`);
		}
	}
process.exit(failed ? 1 : 0);
