import { timingSafeEqual } from "node:crypto";
import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import { z } from "zod";
import { env } from "./env.js";
import {
	enqueueText,
	NotConnectedError,
	NotOnWhatsappError,
} from "./send-queue.js";
import { logout, start } from "./socket.js";
import { getStatus } from "./state.js";

const sendSchema = z.object({
	to: z.string().regex(/^\+[1-9]\d{6,14}$/),
	body: z.string().min(1).max(4096),
});

/** Private HTTP API; only the app (same Docker network) can reach it. */
export function createGatewayServer() {
	return createServer((req, res) => {
		handle(req, res).catch((error) => {
			console.error(error);
			reply(res, 500, { error: "INTERNAL" });
		});
	});
}

async function handle(req: IncomingMessage, res: ServerResponse) {
	const route = `${req.method} ${req.url?.split("?")[0]}`;
	if (route === "GET /health") return reply(res, 200, { ok: true });
	if (!authorized(req)) return reply(res, 401, { error: "UNAUTHORIZED" });

	switch (route) {
		case "GET /status":
			return reply(res, 200, getStatus());
		case "POST /connect":
			await start();
			return reply(res, 200, getStatus());
		case "POST /logout":
			await logout();
			return reply(res, 200, getStatus());
		case "POST /send":
			return send(req, res);
		default:
			return reply(res, 404, { error: "NOT_FOUND" });
	}
}

async function send(req: IncomingMessage, res: ServerResponse) {
	const parsed = sendSchema.safeParse(await readJson(req));
	if (!parsed.success) return reply(res, 400, { error: "INVALID" });
	try {
		await enqueueText(parsed.data.to, parsed.data.body);
		return reply(res, 200, { ok: true });
	} catch (error) {
		if (error instanceof NotConnectedError)
			return reply(res, 503, { error: "NOT_CONNECTED" });
		if (error instanceof NotOnWhatsappError)
			return reply(res, 422, { error: "NOT_ON_WHATSAPP" });
		throw error;
	}
}

function authorized(req: IncomingMessage) {
	const header = req.headers.authorization;
	if (!header) return false;
	const given = Buffer.from(header);
	const expected = Buffer.from(`Bearer ${env.WA_GATEWAY_SECRET}`);
	return given.length === expected.length && timingSafeEqual(given, expected);
}

async function readJson(req: IncomingMessage): Promise<unknown> {
	let raw = "";
	for await (const chunk of req) {
		raw += chunk;
		if (raw.length > 16_384) return null;
	}
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function reply(res: ServerResponse, code: number, body: unknown) {
	res.writeHead(code, { "Content-Type": "application/json" });
	res.end(JSON.stringify(body));
}
