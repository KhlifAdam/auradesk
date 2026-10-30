/** A media's focal point as a CSS `object-position`, e.g. "50% 30%". */
export const focusPosition = (media: { focusX: number; focusY: number }) =>
	`${media.focusX}% ${media.focusY}%`;
