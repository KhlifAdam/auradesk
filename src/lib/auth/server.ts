import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, emailOTP, phoneNumber } from "better-auth/plugins";
import { LOCALE_COOKIE } from "@/i18n/config";
import { clientIntentHooks } from "@/lib/auth/client-intent-hooks";
import { ROLES } from "@/lib/auth/roles";
import { socialProvidersConfig } from "@/lib/auth/social-providers";
import { db } from "@/lib/db";
import { sendEmailVerificationOtp } from "@/lib/mail/send-email-verification-otp";
import { sendPasswordResetOtp } from "@/lib/mail/send-password-reset-otp";
import { phoneEmail, toE164 } from "@/lib/phone";
import { sendOtpSms } from "@/lib/sms/send-client-sms";

const OTP_EXPIRES_IN_SECONDS = 600;
const SMS_MIN_GAP_MS = 60 * 1000;
const SMS_MAX_PER_DAY = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Caps the texts sent to one number, so nobody can run up the SMS bill or
 * harass someone through the sign-in form. The IP rate limit below covers
 * one source; this covers one victim. Every code request leaves a
 * verification row, so those rows are the count.
 */
async function mayTextOtp(phone: string) {
	const now = Date.now();
	const [lastMinute, lastDay] = await Promise.all([
		db.verification.count({
			where: {
				identifier: phone,
				createdAt: { gt: new Date(now - SMS_MIN_GAP_MS) },
			},
		}),
		db.verification.count({
			where: { identifier: phone, createdAt: { gt: new Date(now - DAY_MS) } },
		}),
	]);
	// The row for this very request already exists, hence `> 1`.
	return lastMinute <= 1 && lastDay <= SMS_MAX_PER_DAY;
}

export const auth = betterAuth({
	database: prismaAdapter(db, {
		provider: "postgresql",
	}),
	databaseHooks: clientIntentHooks,
	user: {
		additionalFields: {
			locale: { type: "string", required: false, input: false },
		},
	},
	emailAndPassword: {
		enabled: true,
		// No session until the address is proven: nobody signs up with
		// someone else's email, and invoices and invitations reach a real inbox.
		requireEmailVerification: true,
	},
	emailVerification: {
		// The 6-digit code (email OTP plugin below) goes out on sign-up, and
		// again when an unverified account tries to sign in.
		sendOnSignUp: true,
		sendOnSignIn: true,
		autoSignInAfterVerification: true,
	},
	rateLimit: {
		enabled: true,
		customRules: {
			// One IP can't spray codes at many numbers or guess them quickly.
			"/phone-number/send-otp": { window: 600, max: 5 },
			"/phone-number/verify": { window: 600, max: 10 },
		},
	},
	socialProviders: socialProvidersConfig,
	plugins: [
		phoneNumber({
			otpLength: 6,
			expiresIn: OTP_EXPIRES_IN_SECONDS,
			allowedAttempts: 3,
			// Only canonical E.164 gets in; the forms normalise before sending.
			phoneNumberValidator: (phone) => toE164(phone) === phone,
			// Signing in with a new number creates the account on the spot.
			signUpOnVerification: {
				getTempEmail: phoneEmail,
				getTempName: (phone) => phone,
			},
			async sendOTP({ phoneNumber: phone, code }, ctx) {
				if (!(await mayTextOtp(phone))) {
					// Nothing is sent, so the code this request just created would only
					// replace the one already texted. Drop it to keep that one valid.
					await db.verification.deleteMany({
						where: { identifier: phone, value: { startsWith: `${code}:` } },
					});
					return;
				}
				const locale = ctx?.getCookie(LOCALE_COOKIE);
				// Not awaited, to avoid leaking whether the account exists via timing.
				sendOtpSms({
					to: phone,
					locale,
					code,
					expiresInMinutes: OTP_EXPIRES_IN_SECONDS / 60,
				}).catch((error) => console.error("Failed to send OTP SMS:", error));
			},
		}),
		admin({
			defaultRole: ROLES.photographer,
			adminRoles: [ROLES.admin],
		}),
		emailOTP({
			// A phone-only account adds its first email this way; the code goes to
			// the new address (the current one is a placeholder).
			changeEmail: { enabled: true },
			// Verification uses a code rather than a link, like every other flow.
			overrideDefaultEmailVerification: true,
			otpLength: 6,
			expiresIn: OTP_EXPIRES_IN_SECONDS,
			allowedAttempts: 3,
			storeOTP: "hashed",
			async sendVerificationOTP({ email, otp, type }) {
				const props = {
					to: email,
					otp,
					expiresInMinutes: OTP_EXPIRES_IN_SECONDS / 60,
				};
				// Not awaited, to avoid leaking whether the account exists via timing.
				const sending =
					type === "forget-password"
						? sendPasswordResetOtp(props)
						: type === "email-verification" || type === "change-email"
							? sendEmailVerificationOtp(props)
							: null;
				sending?.catch((error) =>
					console.error(`Failed to send ${type} OTP email:`, error),
				);
			},
		}),
	],
});
