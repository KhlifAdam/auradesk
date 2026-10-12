/** What the photo assistant can flag on a photo. */
export const PHOTO_FLAGS = [
	"BLURRY",
	"UNDEREXPOSED",
	"OVEREXPOSED",
	"EYES_CLOSED",
	/** A sharper near-copy of it exists in the gallery. */
	"DUPLICATE",
] as const;

export type PhotoFlag = (typeof PHOTO_FLAGS)[number];

// Calibrated on real shoot previews measured at 512 px wide: sharp photos
// score 150-950; a Gaussian blur of σ 2 drops to ~290 and σ 4 to ~50.
export const BLUR_THRESHOLD = 80;
export const DARK_BRIGHTNESS = 0.2;
export const BRIGHT_BRIGHTNESS = 0.75;
export const CLIPPED_SHARE = 0.2;
/** Hash bits that may differ between near-duplicates (distinct shots differ by 20+). */
export const DUPLICATE_DISTANCE = 10;

/** Photos analysed per request, so each call stays well under a timeout. */
export const ANALYSIS_BATCH = 4;

/** Kinds of clips the video assistant sorts footage into. */
export const VIDEO_CATEGORIES = [
	"CEREMONY",
	"SPEECH",
	"DANCE",
	"PORTRAIT",
	"GROUP",
	"DETAILS",
	"LANDSCAPE",
	"PRODUCT",
	"BEHIND_THE_SCENES",
	"OTHER",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

/** A clip that is mostly silent: B-roll, or a recording without usable sound. */
export const MOSTLY_SILENT = 0.6;
