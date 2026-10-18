export interface DeviceSession {
	id: string;
	browser: string | null;
	os: string | null;
	mobile: boolean;
	lastActiveAt: string;
	/** The browser looking at the page. */
	current: boolean;
}

export interface SecurityOverview {
	/** Signs in with email and password (not only Google, GitHub or a code). */
	hasPassword: boolean;
	/** Linked sign-in providers, e.g. "google", with their account row. */
	linked: { provider: string; accountId: string }[];
	sessions: DeviceSession[];
}
