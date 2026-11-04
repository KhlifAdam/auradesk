import { rm } from "node:fs/promises";
import makeWASocket, {
	Browsers,
	DEFAULT_CONNECTION_CONFIG,
	DisconnectReason,
	fetchLatestWaWebVersion,
	jidDecode,
	useMultiFileAuthState,
	type WASocket,
} from "baileys";
import pino from "pino";
import QRCode from "qrcode";
import { env } from "./env.js";
import { getStatus, setStatus } from "./state.js";

const logger = pino({ level: env.LOG_LEVEL });
const MIN_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS = 60_000;

let sock: WASocket | null = null;
let backoff = MIN_BACKOFF_MS;
let retryTimer: NodeJS.Timeout | null = null;
/** The last write of the keys: a restart must not read them half-saved. */
let saving: Promise<void> = Promise.resolve();

/** The open socket, or null when WhatsApp is not connected. */
export function connectedSocket(): WASocket | null {
	return getStatus().state === "CONNECTED" ? sock : null;
}

/**
 * Opens the one WhatsApp socket. With saved keys it reconnects silently;
 * without them it shows a QR code. Any previous socket is closed first, so
 * two sockets never share the same keys (WhatsApp would log both out).
 */
export async function start() {
	if (retryTimer) clearTimeout(retryTimer);
	retryTimer = null;
	closeSocket();

	// Right after a scan WhatsApp asks for a restart while the new keys are
	// still being written; reading them too early would lose the link.
	await saving;
	const { state, saveCreds } = await useMultiFileAuthState(env.AUTH_DIR);
	const version = await currentWaWebVersion();
	const linked = Boolean(state.creds.me);
	setStatus({ state: linked ? "CONNECTING" : "QR_PENDING", qr: null });

	const current = makeWASocket({
		version,
		auth: state,
		logger,
		// A common desktop identity: WhatsApp has rejected unusual ones.
		browser: Browsers.macOS("Desktop"),
		markOnlineOnConnect: false,
		syncFullHistory: false,
	});
	sock = current;
	current.ev.on("creds.update", () => {
		saving = saving.then(saveCreds).catch((error) => {
			logger.error({ error }, "Could not save the WhatsApp keys");
		});
	});
	current.ev.on("connection.update", async (update) => {
		// A stale socket (replaced by a newer `start`) must not touch the state.
		if (sock !== current) return;
		if (update.qr) {
			setStatus({
				state: "QR_PENDING",
				qr: await QRCode.toDataURL(update.qr, { margin: 1, width: 320 }),
			});
		}
		if (update.connection === "open") {
			backoff = MIN_BACKOFF_MS;
			setStatus({
				state: "CONNECTED",
				qr: null,
				phone: linkedPhone(current),
				lastError: null,
			});
		}
		if (update.connection === "close") {
			const error = update.lastDisconnect?.error;
			await onClose(statusCode(error), error?.message ?? null);
		}
	});
}

async function onClose(code: number | undefined, message: string | null) {
	sock = null;
	if (code === DisconnectReason.loggedOut) {
		// Unlinked from the phone (or banned): the keys are dead, a new QR is needed.
		await rm(env.AUTH_DIR, { recursive: true, force: true });
		setStatus({
			state: "LOGGED_OUT",
			qr: null,
			phone: null,
			lastError: message,
		});
		return;
	}
	const { state } = getStatus();
	if (state === "QR_PENDING" && code !== DisconnectReason.restartRequired) {
		// The QR code expired unscanned: wait for the admin to ask for a new one.
		setStatus({ state: "LOGGED_OUT", qr: null, lastError: message });
		return;
	}
	// A restart right after scanning is expected; anything else backs off.
	const delay = code === DisconnectReason.restartRequired ? 0 : nextBackoff();
	if (state === "CONNECTED")
		setStatus({ state: "CONNECTING", lastError: message });
	retryTimer = setTimeout(() => void start().catch(retryLater), delay);
}

/**
 * The version WhatsApp Web runs today: linking fails ("Couldn't link device")
 * with an outdated one, and the one bundled with Baileys goes stale.
 */
async function currentWaWebVersion() {
	try {
		const { version } = await fetchLatestWaWebVersion({
			signal: AbortSignal.timeout(10_000),
		});
		return version;
	} catch (error) {
		logger.warn({ error }, "Could not fetch the WhatsApp Web version");
		return DEFAULT_CONNECTION_CONFIG.version;
	}
}

function retryLater(error: unknown) {
	logger.error({ error }, "WhatsApp start failed");
	setStatus({ state: "CONNECTING", lastError: String(error) });
	retryTimer = setTimeout(() => void start().catch(retryLater), nextBackoff());
}

function nextBackoff() {
	const delay = backoff;
	backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
	return delay;
}

/** Unlinks this device from the phone and forgets the keys. */
export async function logout() {
	if (retryTimer) clearTimeout(retryTimer);
	const current = sock;
	sock = null;
	await current?.logout().catch(() => undefined);
	current?.end(undefined);
	await rm(env.AUTH_DIR, { recursive: true, force: true });
	setStatus({ state: "LOGGED_OUT", qr: null, phone: null, lastError: null });
}

function closeSocket() {
	const current = sock;
	sock = null;
	current?.ev.removeAllListeners("connection.update");
	current?.end(undefined);
}

function linkedPhone(current: WASocket) {
	const user = current.user;
	const id = user?.phoneNumber ?? user?.id;
	const digits = id ? jidDecode(id)?.user : undefined;
	return digits ? `+${digits}` : null;
}

function statusCode(error: unknown) {
	return (error as { output?: { statusCode?: number } } | undefined)?.output
		?.statusCode;
}
