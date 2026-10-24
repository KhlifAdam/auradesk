import { z } from "zod";
import { PAYMENT_METHODS } from "@/services/invoices/options";
import { PROJECT_STAGES } from "@/services/projects/stages";

/**
 * Tools that change data. The model only proposes them: they have no server
 * `execute`, so the browser runs them through the existing Server Actions.
 * - auto: small internal changes that run at once.
 * - confirm: anything that notifies someone or changes money or status.
 * - danger: deletions, behind a red confirmation.
 * Shared by the route (definitions) and the chat (execution), so no server imports.
 */
export type ActionTier = "auto" | "confirm" | "danger";

const id = z.string().min(1);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:mm");

export const WRITE_TOOLS = {
	add_booking_note: {
		tier: "auto",
		description: "Add a private note to a booking request's activity.",
		inputSchema: z.object({ bookingId: id, body: z.string().min(1).max(2000) }),
	},
	update_client_notes: {
		tier: "auto",
		description:
			"Replace a client's private notes. Read them with client_summary first and keep what should stay.",
		inputSchema: z.object({ clientId: id, notes: z.string().max(5000) }),
	},
	create_calendar_event: {
		tier: "auto",
		description:
			"Add a calendar event (meeting, shoot, availability…) in the user's time zone.",
		inputSchema: z.object({
			type: z.enum(["SHOOT", "MEETING", "AVAILABLE", "UNAVAILABLE", "OTHER"]),
			title: z.string().max(120),
			date: day,
			startTime: time.optional().describe("Omit for an all-day event"),
			endTime: time.optional(),
			location: z.string().max(160).optional(),
			projectId: id.optional(),
			notes: z.string().max(2000).optional(),
		}),
	},
	confirm_booking: {
		tier: "confirm",
		description:
			"Confirm a booking request: creates the project and invites the client. Set withoutClient when the client hasn't accepted the proposal yet.",
		inputSchema: z.object({ bookingId: id, withoutClient: z.boolean() }),
	},
	decline_booking: {
		tier: "confirm",
		description: "Decline a booking request, with an optional reason.",
		inputSchema: z.object({
			bookingId: id,
			reason: z.string().max(500).optional(),
		}),
	},
	send_quote: {
		tier: "confirm",
		description:
			"Send a booking request (the proposal and price) to the client by email or text.",
		inputSchema: z.object({ bookingId: id }),
	},
	send_invoice: {
		tier: "confirm",
		description: "Send a DRAFT invoice to the client by email.",
		inputSchema: z.object({ invoiceId: id }),
	},
	record_payment: {
		tier: "confirm",
		description: "Record a payment received on an invoice.",
		inputSchema: z.object({
			invoiceId: id,
			amount: z.number().positive(),
			paidAt: day,
			method: z.enum(PAYMENT_METHODS),
		}),
	},
	cancel_invoice: {
		tier: "confirm",
		description: "Cancel an invoice (kept for the records, nothing owed).",
		inputSchema: z.object({ invoiceId: id }),
	},
	share_gallery: {
		tier: "confirm",
		description:
			"Share a gallery with its client (they get notified), or stop sharing it.",
		inputSchema: z.object({ galleryId: id, shared: z.boolean() }),
	},
	send_message: {
		tier: "confirm",
		description:
			"Send a chat message to a client who shares a project with the studio. Write the message in the client's language.",
		inputSchema: z.object({ clientId: id, body: z.string().min(1).max(4000) }),
	},
	set_project_stage: {
		tier: "confirm",
		description: "Move a project to another workflow stage.",
		inputSchema: z.object({ projectId: id, stage: z.enum(PROJECT_STAGES) }),
	},
	invite_client: {
		tier: "confirm",
		description: "Invite a client to a project by email or phone number.",
		inputSchema: z.object({
			projectId: id,
			contact: z.string().min(1).max(200),
		}),
	},
	invite_team_member: {
		tier: "confirm",
		description: "Invite a collaborator to the team by email.",
		inputSchema: z.object({
			name: z.string().min(1).max(120),
			email: z.email(),
			specialty: z.string().max(80).optional(),
		}),
	},
	assign_team_member: {
		tier: "confirm",
		description: "Put a team member on a project, with an optional role.",
		inputSchema: z.object({
			projectId: id,
			memberId: id,
			role: z.string().max(80).optional(),
		}),
	},
	delete_booking: {
		tier: "danger",
		description: "Delete a booking request for good.",
		inputSchema: z.object({ bookingId: id }),
	},
	delete_invoice: {
		tier: "danger",
		description: "Delete an invoice for good.",
		inputSchema: z.object({ invoiceId: id }),
	},
	delete_calendar_event: {
		tier: "danger",
		description: "Delete a calendar event (not a project date).",
		inputSchema: z.object({ eventId: id }),
	},
	remove_team_member: {
		tier: "danger",
		description: "Remove a collaborator from the team and their projects.",
		inputSchema: z.object({ memberId: id }),
	},
} as const satisfies Record<
	string,
	{ tier: ActionTier; description: string; inputSchema: z.ZodType }
>;

export type WriteToolName = keyof typeof WRITE_TOOLS;
export type WriteToolInput<N extends WriteToolName> = z.infer<
	(typeof WRITE_TOOLS)[N]["inputSchema"]
>;

/**
 * What a write tool reports back once the user acted. `outcome` spells it out
 * for the model, so a small one can't mistake a cancel for a success.
 */
export type WriteToolOutput =
	| { status: "done"; outcome: string }
	| { status: "cancelled"; outcome: string }
	| { status: "failed"; outcome: string; error: string };

export const toolOutcome = {
	done: (): WriteToolOutput => ({
		status: "done",
		outcome: "Done: the change is saved.",
	}),
	cancelled: (): WriteToolOutput => ({
		status: "cancelled",
		outcome: "The user pressed Cancel. Nothing was done or changed.",
	}),
	failed: (error: string): WriteToolOutput => ({
		status: "failed",
		outcome: `It failed and nothing was changed: ${error}`,
		error,
	}),
};

export const isWriteTool = (name: string): name is WriteToolName =>
	name in WRITE_TOOLS;
