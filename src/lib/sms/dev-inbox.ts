import "server-only";

// In development, texts aren't sent: they are kept here (the last few, in
// the server's memory) and shown in the on-screen "Test SMS" inbox.

export interface DevSms {
	id: number;
	to: string;
	body: string;
	at: string;
}

const KEPT = 10;

/** Survives hot reloads: one inbox per server process. */
const store = globalThis as unknown as { __devSmsInbox?: DevSms[] };

/** Only with the console provider in development; never in production. */
export const devInboxEnabled = () =>
	process.env.NODE_ENV === "development" &&
	(process.env.SMS_PROVIDER ?? "console") === "console";

export function keepDevSms(to: string, body: string) {
	const sms = { id: Date.now(), to, body, at: new Date().toISOString() };
	store.__devSmsInbox = [sms, ...devSmsInbox()].slice(0, KEPT);
}

export const devSmsInbox = (): DevSms[] => store.__devSmsInbox ?? [];
