"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { emptyToNull, idSchema } from "@/services/shared/schemas";
import {
	BUSY_TYPES,
	type CalendarEventType,
	canLinkProject,
} from "./constants";
import { dayOffClash, eventSpan, overlaps } from "./day-off";
import {
	type EventPayload,
	eventPayloadSchema,
	updateEventSchema,
} from "./schemas";

type SaveResult = ActionResult<{ id: string; conflicts: number }>;

const isBusy = (type: CalendarEventType) =>
	(BUSY_TYPES as readonly CalendarEventType[]).includes(type);

function toData(event: EventPayload) {
	return {
		type: event.type,
		title: event.title,
		allDay: event.allDay,
		startsAt: new Date(event.startsAt),
		endsAt: new Date(event.endsAt),
		location: emptyToNull(event.location),
		notes: emptyToNull(event.notes),
		projectId: canLinkProject(event.type) ? emptyToNull(event.projectId) : null,
	};
}

async function ownsProject(photographerId: string, projectId: string) {
	if (!projectId) return true;
	const project = await db.project.findFirst({
		where: { id: projectId, photographerId },
		select: { id: true },
	});
	return Boolean(project);
}

/** Busy events overlapping this one; all-day events cover their whole last day. */
async function countConflicts(
	photographerId: string,
	event: EventPayload,
	excludeId: string,
) {
	if (!isBusy(event.type)) return 0;
	const { start, end } = eventSpan(event);
	return db.calendarEvent.count({
		where: {
			photographerId,
			id: { not: excludeId },
			type: { in: [...BUSY_TYPES] },
			...overlaps(start, end),
		},
	});
}

/** The overview and the calendar both read events. */
function revalidateCalendar() {
	revalidatePath("/dashboard", "layout");
}

export async function createCalendarEvent(input: unknown): Promise<SaveResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = eventPayloadSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	if (!(await ownsProject(photographerId, parsed.data.projectId)))
		return fail("notFound");
	const clash = await dayOffClash(photographerId, parsed.data);
	if (clash) return fail(clash);

	const { id } = await db.calendarEvent.create({
		data: { photographerId, ...toData(parsed.data) },
		select: { id: true },
	});
	const conflicts = await countConflicts(photographerId, parsed.data, id);
	revalidateCalendar();
	return ok({ id, conflicts });
}

export async function updateCalendarEvent(input: unknown): Promise<SaveResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = updateEventSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { id, event } = parsed.data;
	if (!(await ownsProject(photographerId, event.projectId)))
		return fail("notFound");
	const clash = await dayOffClash(photographerId, event, id);
	if (clash) return fail(clash);
	const { count } = await db.calendarEvent.updateMany({
		where: { id, photographerId },
		data: toData(event),
	});
	if (count === 0) return fail("notFound");

	const conflicts = await countConflicts(photographerId, event, id);
	revalidateCalendar();
	return ok({ id, conflicts });
}

export async function deleteCalendarEvent(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.calendarEvent.deleteMany({
		where: { id: parsed.data, photographerId },
	});
	if (count === 0) return fail("notFound");

	revalidateCalendar();
	return ok();
}
