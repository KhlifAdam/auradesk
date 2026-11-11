/**
 * Why a project lit up for the client, most important first: when several
 * changes pile up before they look, the most important one is kept.
 */
export const PROJECT_UPDATES = [
	"delivered",
	"proofs",
	"stage",
	"book",
	"payment",
	"details",
] as const;

export type ProjectUpdate = (typeof PROJECT_UPDATES)[number];

export const isProjectUpdate = (value: unknown): value is ProjectUpdate =>
	(PROJECT_UPDATES as readonly unknown[]).includes(value);

/** The update to keep: the new one, unless an unseen one matters more. */
export function keepUpdate(
	pending: string | null,
	next: ProjectUpdate,
): ProjectUpdate {
	if (!isProjectUpdate(pending)) return next;
	return PROJECT_UPDATES.indexOf(pending) < PROJECT_UPDATES.indexOf(next)
		? pending
		: next;
}
