import { connectedSocket } from "./socket.js";

/** Gap between two messages: a steady pace looks less like spam to WhatsApp. */
const GAP_MS = 1_500;

export class NotConnectedError extends Error {}
export class NotOnWhatsappError extends Error {}

let queue: Promise<unknown> = Promise.resolve();

/** Sends `body` to an E.164 number, one message at a time. */
export function enqueueText(to: string, body: string) {
	const job = queue.then(() => sendText(to, body));
	// The chain carries on after a failure; the caller still sees the error.
	queue = job.catch(() => undefined).then(pause);
	return job;
}

async function sendText(to: string, body: string) {
	const sock = connectedSocket();
	if (!sock) throw new NotConnectedError();
	const [match] = (await sock.onWhatsApp(to.replace(/\D/g, ""))) ?? [];
	if (!match?.exists) throw new NotOnWhatsappError();
	await sock.sendMessage(match.jid, { text: body });
}

function pause() {
	return new Promise((resolve) => setTimeout(resolve, GAP_MS));
}
