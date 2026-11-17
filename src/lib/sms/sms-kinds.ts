/**
 * Every kind of text message (the `Sms` keys in messages/*.json), in the order
 * the admin page lists them. Light on purpose: client forms import it.
 */
export const SMS_KINDS = [
	"otp",
	"projectInvitation",
	"galleryShared",
	"newMessage",
	"bookingSent",
	"projectCreated",
	"galleriesReady",
	"projectDelivered",
	"changeForClient",
	"changeForStudio",
] as const;

export type SmsKey = (typeof SMS_KINDS)[number];
