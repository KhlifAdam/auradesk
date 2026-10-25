import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_PATHS } from "@/lib/auth/admin-paths";
import { AUTH_PATHS } from "@/lib/auth/client-intent";

/**
 * Fast first gate: sends visitors without a session cookie to the matching
 * sign-in page, with no database or network call. The cookie is not trusted:
 * `requirePhotographer`, `requireClient` and `requireAdmin` validate the
 * session on every page and action.
 *
 * Auth pages are not redirected when a cookie exists, because an expired
 * cookie would bounce between the sign-in page and the app forever.
 */
export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	if (pathname === ADMIN_PATHS.login) return NextResponse.next();
	if (getSessionCookie(request.headers)) return NextResponse.next();
	const login = pathname.startsWith("/admin")
		? ADMIN_PATHS.login
		: pathname.startsWith("/portal")
			? AUTH_PATHS.client.login
			: AUTH_PATHS.photographer.login;
	return NextResponse.redirect(new URL(login, request.url));
}

export const config = {
	matcher: [
		"/dashboard/:path*",
		"/portal/:path*",
		"/team/:path*",
		"/admin/:path*",
	],
};
