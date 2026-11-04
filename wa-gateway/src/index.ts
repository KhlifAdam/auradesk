import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { env } from "./env.js";
import { createGatewayServer } from "./server.js";
import { start } from "./socket.js";
import { setStatus } from "./state.js";
import { startWatchdog } from "./watchdog.js";

// Settle the state before the watchdog's first report: a device linked before
// the restart is reconnecting, not logged out.
const linked = await hasLinkedDevice();
if (linked) setStatus({ state: "CONNECTING" });
startWatchdog();

createGatewayServer().listen(env.PORT, () => {
	console.info(`WhatsApp gateway listening on :${env.PORT}`);
});

// Reconnect a device linked before the restart; otherwise wait for the admin.
if (linked)
	start().catch((error) => console.error("WhatsApp start failed", error));

async function hasLinkedDevice() {
	try {
		const creds = JSON.parse(
			await readFile(join(env.AUTH_DIR, "creds.json"), "utf8"),
		);
		return Boolean(creds.me?.id);
	} catch {
		return false;
	}
}
