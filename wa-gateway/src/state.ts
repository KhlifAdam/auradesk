/** Where the WhatsApp link stands, as seen by the gateway. */
export type LinkState =
	| "LOGGED_OUT" // no linked device: the admin must scan a QR code
	| "QR_PENDING" // a QR code is waiting to be scanned
	| "CONNECTING" // linked, (re)opening the connection
	| "CONNECTED";

export interface LinkStatus {
	state: LinkState;
	/** Data URL of the QR code while `QR_PENDING`. */
	qr: string | null;
	/** The linked number in E.164, once known. */
	phone: string | null;
	/** When the current state began (ISO). */
	since: string;
	/** Why the last connection closed, for the admin page. */
	lastError: string | null;
}

let status: LinkStatus = {
	state: "LOGGED_OUT",
	qr: null,
	phone: null,
	since: new Date().toISOString(),
	lastError: null,
};

const listeners = new Set<(status: LinkStatus) => void>();

export function getStatus(): LinkStatus {
	return status;
}

export function setStatus(patch: Partial<LinkStatus>) {
	const changed = patch.state !== undefined && patch.state !== status.state;
	status = {
		...status,
		...patch,
		since: changed ? new Date().toISOString() : status.since,
	};
	if (changed) for (const listener of listeners) listener(status);
}

/** Called on every state change (not on QR refreshes). */
export function onStateChange(listener: (status: LinkStatus) => void) {
	listeners.add(listener);
}
