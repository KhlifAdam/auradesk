/** What a client should do next on a project, from where it stands. */
export type ClientNextStep =
	| "waitShoot"
	| "chooseFiles"
	| "waitStudio"
	| "payBalance"
	| "downloadFiles";

interface ProjectState {
	stage: string;
	delivered: boolean;
	price: number | null;
	paymentStatus: string;
	galleries: { id: string; kind: string; submitted: boolean }[];
}

interface InvoiceState {
	id: string;
	status: string;
	balance: number;
}

const BEFORE_SHOOT = ["BOOKING", "PREP", "SHOOTING"];

/** The step, and where to go for it (a gallery to choose from, an invoice to pay…). */
export function clientNextStep(
	project: ProjectState,
	invoices: InvoiceState[],
): { step: ClientNextStep; targetId: string | null } {
	if (project.delivered) {
		const final = project.galleries.find((g) => g.kind === "FINAL");
		return { step: "downloadFiles", targetId: final?.id ?? null };
	}
	const unpaid = invoices.find((i) => i.status !== "PAID" && i.balance > 0);
	if (unpaid) return { step: "payBalance", targetId: unpaid.id };
	if (project.stage === "SELECTION") {
		const toChoose = project.galleries.find(
			(g) => g.kind === "PROOFS" && !g.submitted,
		);
		if (toChoose) return { step: "chooseFiles", targetId: toChoose.id };
	}
	// Delivery waits for the last payment even without an invoice.
	if (
		project.stage === "VALIDATION" &&
		project.price !== null &&
		project.paymentStatus !== "PAID"
	)
		return { step: "payBalance", targetId: null };
	if (BEFORE_SHOOT.includes(project.stage))
		return { step: "waitShoot", targetId: null };
	return { step: "waitStudio", targetId: null };
}
