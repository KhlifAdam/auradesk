/** "Chrome on Windows" from a User-Agent header; null parts are unknown. */
export function describeDevice(userAgent: string | null) {
	const ua = userAgent ?? "";
	const browser = /Edg\//.test(ua)
		? "Edge"
		: /OPR\//.test(ua)
			? "Opera"
			: /Firefox\//.test(ua)
				? "Firefox"
				: /Chrome\//.test(ua)
					? "Chrome"
					: /Safari\//.test(ua)
						? "Safari"
						: null;
	const os = /Windows/.test(ua)
		? "Windows"
		: /iPhone|iPad/.test(ua)
			? "iOS"
			: /Android/.test(ua)
				? "Android"
				: /Mac OS X/.test(ua)
					? "macOS"
					: /Linux/.test(ua)
						? "Linux"
						: null;
	return { browser, os, mobile: /Mobi|iPhone|Android/.test(ua) };
}
