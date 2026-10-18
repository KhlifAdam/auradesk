// Finds the chosen photos' originals in a folder of the photographer's disk
// and copies them, renamed, into a new folder next to them. Everything stays
// on the computer: nothing is uploaded or downloaded, the bytes are copied
// as they are, so the copies are the full-quality originals.

declare global {
	interface Window {
		showDirectoryPicker?: (options?: {
			mode?: "read" | "readwrite";
		}) => Promise<FileSystemDirectoryHandle>;
	}
}

/** Camera RAW formats copied along with a chosen JPEG of the same name. */
const RAW_EXTENSIONS = [
	"arw",
	"cr2",
	"cr3",
	"crw",
	"dng",
	"nef",
	"nrw",
	"orf",
	"pef",
	"raf",
	"rw2",
	"rwl",
	"srw",
	"3fr",
	"iiq",
	"x3f",
];
/** Edit settings saved by Lightroom, Capture One… next to a RAW file. */
const SIDECAR_EXTENSIONS = ["xmp"];

export interface WantedOriginal {
	/** The name it had on disk when it was uploaded. */
	name: string;
	size: number;
	/** `lastModified` of the original, to tell apart same-name files. */
	modifiedAt: number;
	/** Its new name, without extension: `mariage-ben-ali_20260912_0001`. */
	newBase: string;
}

export interface CollectReport {
	copied: number;
	/** RAW and sidecar files copied along with their JPEG. */
	twins: number;
	/** Chosen photos whose original wasn't found in the folder. */
	missing: string[];
}

interface Found {
	file: FileSystemFileHandle;
	dir: FileSystemDirectoryHandle;
}

export const canCollectOriginals = () =>
	typeof window !== "undefined" && "showDirectoryPicker" in window;

const splitName = (name: string) => {
	const dot = name.lastIndexOf(".");
	return dot > 0
		? { base: name.slice(0, dot), ext: name.slice(dot + 1).toLowerCase() }
		: { base: name, ext: "" };
};

/** Every file under `dir`, by lower-case name; `skip` is the output folder. */
async function indexFolder(dir: FileSystemDirectoryHandle, skip: string) {
	const index = new Map<string, Found[]>();
	const walk = async (current: FileSystemDirectoryHandle) => {
		for await (const [name, handle] of current.entries()) {
			if (handle.kind === "directory") {
				if (name !== skip && !name.startsWith("."))
					await walk(handle as FileSystemDirectoryHandle);
				continue;
			}
			const key = name.toLowerCase();
			const list = index.get(key) ?? [];
			list.push({ file: handle as FileSystemFileHandle, dir: current });
			index.set(key, list);
		}
	};
	await walk(dir);
	return index;
}

/** The same name, size and (when ambiguous) date: that is the original. */
async function findOriginal(
	index: Map<string, Found[]>,
	wanted: WantedOriginal,
) {
	const candidates = index.get(wanted.name.toLowerCase()) ?? [];
	let bySize: Found | null = null;
	for (const candidate of candidates) {
		const file = await candidate.file.getFile();
		if (file.size !== wanted.size) continue;
		if (file.lastModified === wanted.modifiedAt) return candidate;
		bySize ??= candidate;
	}
	return bySize;
}

async function copyFile(
	source: FileSystemFileHandle,
	target: FileSystemDirectoryHandle,
	name: string,
) {
	const file = await source.getFile();
	const handle = await target.getFileHandle(name, { create: true });
	await file.stream().pipeTo(await handle.createWritable());
}

/** The RAW and sidecar files lying next to the original, with its base name. */
async function twinsOf(
	index: Map<string, Found[]>,
	original: Found,
	base: string,
) {
	const twins: { found: Found; ext: string }[] = [];
	for (const ext of [...RAW_EXTENSIONS, ...SIDECAR_EXTENSIONS]) {
		for (const found of index.get(`${base}.${ext}`.toLowerCase()) ?? []) {
			if (await found.dir.isSameEntry(original.dir)) twins.push({ found, ext });
		}
	}
	return twins;
}

/**
 * Copies each wanted original (and its RAW twin) from `source` into the
 * folder `folderName` inside it, under its new name.
 */
export async function collectOriginals(
	source: FileSystemDirectoryHandle,
	wanted: WantedOriginal[],
	folderName: string,
	onProgress: (done: number) => void,
): Promise<CollectReport> {
	const index = await indexFolder(source, folderName);
	const target = await source.getDirectoryHandle(folderName, { create: true });
	const report: CollectReport = { copied: 0, twins: 0, missing: [] };

	for (const [i, item] of wanted.entries()) {
		const original = await findOriginal(index, item);
		if (!original) {
			report.missing.push(item.name);
		} else {
			const { base, ext } = splitName(item.name);
			await copyFile(original.file, target, `${item.newBase}.${ext}`);
			report.copied++;
			for (const twin of await twinsOf(index, original, base)) {
				await copyFile(twin.found.file, target, `${item.newBase}.${twin.ext}`);
				report.twins++;
			}
		}
		onProgress(i + 1);
	}
	return report;
}
