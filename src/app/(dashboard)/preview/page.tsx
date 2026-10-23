import { PreviewShell } from "@/components/dashboard/preview/preview-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { resolvePreview } from "@/services/preview/resolve-preview";

export default async function PreviewPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const { photographerId } = await requirePhotographer();
	const { params, data, design, savedDesign, hasStudio, hasContent } =
		await resolvePreview(photographerId, await searchParams);

	return (
		<PreviewShell
			params={params}
			initialData={data}
			design={design}
			savedDesign={savedDesign}
			hasStudio={hasStudio}
			hasContent={hasContent}
		/>
	);
}
