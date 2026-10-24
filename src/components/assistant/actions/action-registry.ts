import type { ActionResult } from "@/lib/action-result";
import type {
	WriteToolInput,
	WriteToolName,
} from "@/lib/ai/assistant/write-tools";
import { deleteBooking } from "@/services/bookings/actions";
import { confirmBooking } from "@/services/bookings/confirm";
import { sendBookingToClient } from "@/services/bookings/send-action";
import {
	addBookingNote,
	declineBooking,
} from "@/services/bookings/status-actions";
import {
	createCalendarEvent,
	deleteCalendarEvent,
} from "@/services/calendar/actions";
import { updateClientNotes } from "@/services/clients/actions";
import { shareGallery } from "@/services/galleries/actions";
import { deleteInvoice } from "@/services/invoices/actions";
import { recordPayment } from "@/services/invoices/payment-actions";
import { cancelInvoice, sendInvoice } from "@/services/invoices/status-actions";
import { sendMessage } from "@/services/messages/actions";
import { updateProjectStage } from "@/services/projects/actions";
import { inviteClient } from "@/services/projects/invite-actions";
import {
	assignTeamMember,
	inviteTeamMember,
	removeTeamMember,
} from "@/services/team/actions";

type Runner<N extends WriteToolName> = (
	input: WriteToolInput<N>,
) => Promise<ActionResult<unknown>>;

/** The assistant's calendar events are in the browser's (the user's) time zone. */
function eventPayload(input: WriteToolInput<"create_calendar_event">) {
	const allDay = !input.startTime;
	const startsAt = allDay
		? `${input.date}T00:00:00.000Z`
		: new Date(`${input.date}T${input.startTime}`).toISOString();
	const endsAt = allDay
		? startsAt
		: input.endTime && input.endTime > (input.startTime ?? "")
			? new Date(`${input.date}T${input.endTime}`).toISOString()
			: new Date(Date.parse(startsAt) + 3_600_000).toISOString();
	return {
		type: input.type,
		title: input.title,
		allDay,
		startsAt,
		endsAt,
		location: input.location ?? "",
		projectId: input.projectId ?? "",
		notes: input.notes ?? "",
	};
}

/**
 * Each write tool mapped to the Server Action that already does the job, so
 * checks, emails and cache updates stay in one place.
 */
export const ACTION_RUNNERS: { [N in WriteToolName]: Runner<N> } = {
	add_booking_note: (i) => addBookingNote({ id: i.bookingId, body: i.body }),
	update_client_notes: (i) => updateClientNotes(i),
	create_calendar_event: (i) => createCalendarEvent(eventPayload(i)),
	confirm_booking: (i) =>
		confirmBooking({ id: i.bookingId, withoutClient: i.withoutClient }),
	decline_booking: (i) =>
		declineBooking({ id: i.bookingId, reason: i.reason ?? "" }),
	send_quote: (i) => sendBookingToClient(i.bookingId),
	send_invoice: (i) => sendInvoice(i.invoiceId),
	record_payment: (i) => recordPayment({ ...i, reference: "" }),
	cancel_invoice: (i) => cancelInvoice(i.invoiceId),
	share_gallery: (i) => shareGallery({ id: i.galleryId, shared: i.shared }),
	send_message: (i) =>
		sendMessage({
			as: "photographer",
			conversationId: null,
			partnerId: i.clientId,
			body: i.body,
		}),
	set_project_stage: (i) =>
		updateProjectStage({ id: i.projectId, stage: i.stage }),
	invite_client: (i) => inviteClient(i),
	invite_team_member: (i) =>
		inviteTeamMember({ ...i, specialty: i.specialty ?? "" }),
	assign_team_member: (i) => assignTeamMember({ ...i, role: i.role ?? "" }),
	delete_booking: (i) => deleteBooking(i.bookingId),
	delete_invoice: (i) => deleteInvoice(i.invoiceId),
	delete_calendar_event: (i) => deleteCalendarEvent(i.eventId),
	remove_team_member: (i) => removeTeamMember(i.memberId),
};

export function runWriteTool<N extends WriteToolName>(
	name: N,
	input: WriteToolInput<N>,
) {
	return (ACTION_RUNNERS[name] as Runner<N>)(input);
}
