import { env } from "./env.js";
import { getStatus, type LinkStatus, onStateChange } from "./state.js";

/** What the app is told: brief reconnects are not worth an alert. */
type ReportedStatus = "CONNECTED" | "DOWN" | "LOGGED_OUT";

/** How long a linked device may stay disconnected before it counts as down. */
const GRACE_MS = 5 * 60_000;
const CHECK_EVERY_MS = 30_000;
/** Reports again now and then, in case the app missed a webhook (deploy). */
const HEARTBEAT_MS = 5 * 60_000;

let lastReported: ReportedStatus | null = null;
let lastReportAt = 0;
let checking = false;

/** Watches the link and tells the app when its status changes. */
export function startWatchdog() {
	onStateChange(() => void check());
	setInterval(() => void check(), CHECK_EVERY_MS).unref();
	// Tell the app where things stand as soon as the gateway starts.
	void check();
}

async function check() {
	if (checking) return;
	const status = getStatus();
	const reported = toReported(status);
	if (!reported) return;
	const stale = Date.now() - lastReportAt > HEARTBEAT_MS;
	if (reported === lastReported && !stale) return;
	checking = true;
	try {
		if (await notify(reported, status)) {
			lastReported = reported;
			lastReportAt = Date.now();
		}
	} finally {
		checking = false;
	}
}

function toReported(status: LinkStatus): ReportedStatus | null {
	if (status.state === "CONNECTED") return "CONNECTED";
	if (status.state === "LOGGED_OUT") return "LOGGED_OUT";
	// Connecting or showing a QR code: only "down" once the grace period is over.
	const since = Date.parse(status.since);
	return Date.now() - since > GRACE_MS ? "DOWN" : null;
}

async function notify(state: ReportedStatus, status: LinkStatus) {
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const response = await fetch(env.APP_WEBHOOK_URL, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${env.WA_GATEWAY_SECRET}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					state,
					phone: status.phone,
					reason: status.lastError,
				}),
				signal: AbortSignal.timeout(10_000),
			});
			if (response.ok) return true;
		} catch {
			// The app may be restarting; try again shortly.
		}
		await new Promise((resolve) => setTimeout(resolve, 5_000 * (attempt + 1)));
	}
	return false;
}
