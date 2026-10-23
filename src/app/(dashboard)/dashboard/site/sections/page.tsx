import { redirect } from "next/navigation";

/** Sections now live in a tab of the Appearance page, next to its preview. */
export default function SiteSectionsPage() {
	redirect("/dashboard/site/appearance?tab=sections");
}
