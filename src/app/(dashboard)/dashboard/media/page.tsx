import { redirect } from "next/navigation";

/** The media library is now the "All files" tab of Portfolio. */
export default async function MediaPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(await searchParams)) {
		if (typeof value === "string") query.set(key, value);
	}
	const suffix = query.size > 0 ? `?${query}` : "";
	redirect(`/dashboard/portfolio/files${suffix}`);
}
