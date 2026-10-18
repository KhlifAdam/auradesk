const MB = 1024 * 1024;
const GB = 1024 * MB;

export const GALLERY_IMAGE_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
] as const;
export const GALLERY_VIDEO_TYPES = [
	"video/mp4",
	"video/quicktime",
	"video/webm",
] as const;
export const GALLERY_MIME_TYPES = [
	...GALLERY_IMAGE_TYPES,
	...GALLERY_VIDEO_TYPES,
] as const;

export const GALLERY_MAX_IMAGE_SIZE = 100 * MB;
export const GALLERY_MAX_VIDEO_SIZE = 10 * GB;

/** Browser-made previews (long edge, JPEG: every browser can encode it) shown in grids. */
export const PREVIEW_MAX_EDGE = 1600;
export const PREVIEW_MAX_FILE_SIZE = 5 * MB;
export const PREVIEW_MIME_TYPE = "image/jpeg";

/**
 * Largest ZIP made in one request. At ~4 MB/s it streams within the 300 s the
 * download route may run (its `maxDuration`); bigger galleries come in several parts.
 */
export const ZIP_PART_MAX_BYTES = GB;

/** How photos are listed: the photographer's order, then a stable tie-break. */
export const GALLERY_ITEM_ORDER = [
	{ position: "asc" as const },
	{ id: "asc" as const },
];

export const GALLERY_PAGE_SIZE = 48;
export const GALLERY_ITEMS_LIMIT = 2000;
export const GALLERIES_PER_PROJECT_LIMIT = 30;
export const SELECTION_LIMIT_MAX = GALLERY_ITEMS_LIMIT;
export const COMMENT_MAX_LENGTH = 1000;

export const GALLERY_EXTENSION_BY_MIME: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"video/mp4": "mp4",
	"video/quicktime": "mov",
	"video/webm": "webm",
};

export function isGalleryMime(type: string) {
	return (GALLERY_MIME_TYPES as readonly string[]).includes(type);
}

/** Proofs galleries hold photos only: a video can't be chosen from a frame. */
export function isProofMime(type: string) {
	return (GALLERY_IMAGE_TYPES as readonly string[]).includes(type);
}

export function isGalleryVideo(type: string) {
	return (GALLERY_VIDEO_TYPES as readonly string[]).includes(type);
}

/** Largest accepted file for a type. */
export const galleryMaxSize = (type: string) =>
	isGalleryVideo(type) ? GALLERY_MAX_VIDEO_SIZE : GALLERY_MAX_IMAGE_SIZE;

// Files go up in parts. S3 needs parts of at least 5 MB (except the last) and
// at most 10,000 of them; 16 MB parts keep a 10 GB video under 700 parts.
const MIN_PART_SIZE = 16 * MB;
const MAX_PARTS = 9000;
/** How many part URLs one request may sign. */
export const PART_URLS_PER_REQUEST = 20;

export function partSizeFor(size: number) {
	return Math.max(MIN_PART_SIZE, Math.ceil(size / MAX_PARTS / MB) * MB);
}

export const partCount = (size: number, partSize: number) =>
	Math.max(1, Math.ceil(size / partSize));

/** Every object of a gallery lives under this prefix in the private bucket. */
export function galleryKeyPrefix(photographerId: string, galleryId: string) {
	return `galleries/${photographerId}/${galleryId}/`;
}

/** The preview sits next to its original: `…/abc.mp4` → `…/abc-preview.jpg`. */
export const previewKeyFor = (key: string) =>
	key.replace(/\.[^./]+$/, "-preview.jpg");
