// The WhatsApp Cloud API only sends messages a business starts through
// templates Meta approved. One template per kind of text message, in en + fr.
// Their wording lives in messages/*.json under `WhatsappTemplates`.
// `pnpm wa:templates` submits them; keep this file free of imports so that
// script can load it with plain Node.

export type CloudTemplateCategory = "AUTHENTICATION" | "UTILITY";

export interface CloudTemplate {
	name: string;
	category: CloudTemplateCategory;
	/** Body variables (named, `{{studio}}`) with an example for Meta's review. */
	params: Record<string, string>;
	/** Whether the message's `url` goes in a "Open" button (Meta rejects a body ending with a variable). */
	link: boolean;
}

/** Keyed by the `Sms` message keys (see sms-copy.ts). */
export const CLOUD_TEMPLATES = {
	// Meta writes the body of authentication templates itself; we fill the code.
	otp: {
		name: "auradesk_otp",
		category: "AUTHENTICATION",
		params: {},
		link: false,
	},
	projectInvitation: {
		name: "auradesk_project_invitation",
		category: "UTILITY",
		params: { studio: "Studio Lumière", project: "Wedding Sarah & Karim" },
		link: true,
	},
	galleryShared: {
		name: "auradesk_gallery_shared",
		category: "UTILITY",
		params: { studio: "Studio Lumière", gallery: "Ceremony" },
		link: true,
	},
	newMessage: {
		name: "auradesk_new_message",
		category: "UTILITY",
		params: { sender: "Studio Lumière" },
		link: true,
	},
	bookingSent: {
		name: "auradesk_booking_sent",
		category: "UTILITY",
		params: { studio: "Studio Lumière", booking: "Engagement shoot" },
		link: true,
	},
	projectCreated: {
		name: "auradesk_project_created",
		category: "UTILITY",
		params: { studio: "Studio Lumière", project: "Wedding Sarah & Karim" },
		link: true,
	},
	galleriesReady: {
		name: "auradesk_galleries_ready",
		category: "UTILITY",
		params: { studio: "Studio Lumière", project: "Wedding Sarah & Karim" },
		link: true,
	},
	projectDelivered: {
		name: "auradesk_project_delivered",
		category: "UTILITY",
		params: { studio: "Studio Lumière", project: "Wedding Sarah & Karim" },
		link: true,
	},
	changeForClient: {
		name: "auradesk_change_for_client",
		category: "UTILITY",
		params: { who: "Studio Lumière", item: "Wedding Sarah & Karim" },
		link: true,
	},
	changeForStudio: {
		name: "auradesk_change_for_studio",
		category: "UTILITY",
		params: { who: "Sarah Ben Ali", item: "Wedding Sarah & Karim" },
		link: true,
	},
} satisfies Record<string, CloudTemplate>;

/** The link button's example suffix, for Meta's review. */
export const LINK_EXAMPLE = "portal/projects/example";
