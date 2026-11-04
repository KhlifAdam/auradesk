import { redirect } from "next/navigation";
import { StartStudioCard } from "@/components/auth/start-studio-card";
import { ADMIN_PATHS } from "@/lib/auth/admin-paths";
import { requireUser } from "@/lib/auth/require-user";
import { ROLES } from "@/lib/auth/roles";

export default async function StartStudioPage() {
	const session = await requireUser();
	if (session.user.role === ROLES.photographer) redirect("/dashboard");
	// Administrators only have the admin space.
	if (session.user.role === ROLES.admin) redirect(ADMIN_PATHS.home);

	return <StartStudioCard email={session.user.email} />;
}
