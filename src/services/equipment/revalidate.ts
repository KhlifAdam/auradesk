import "server-only";

import { revalidatePath } from "next/cache";

/** The inventory, projects (their gear) and the overview reminders. */
export function revalidateEquipment() {
	revalidatePath("/dashboard", "layout");
}
