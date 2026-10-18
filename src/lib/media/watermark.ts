import "server-only";

import sharp from "sharp";

const TILE_WIDTH = 420;
const TILE_HEIGHT = 240;
const OUTPUT_QUALITY = 82;

const escapeXml = (text: string) =>
	text.replace(/[<>&'"]/g, (char) => `&#${char.charCodeAt(0)};`);

/**
 * One diagonal tile: a © drawn as shapes (it shows even on a server without
 * fonts) and the studio name. White with a dark outline, so it reads on
 * both light and dark photos.
 */
function tileSvg(label: string, scale: number) {
	const text = escapeXml(label.slice(0, 40));
	const width = Math.max(1, Math.floor(TILE_WIDTH * scale));
	const height = Math.max(1, Math.floor(TILE_HEIGHT * scale));
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"
	viewBox="0 0 ${TILE_WIDTH} ${TILE_HEIGHT}">
	<g transform="rotate(-28 ${TILE_WIDTH / 2} ${TILE_HEIGHT / 2})" fill="none"
		stroke="#fff" stroke-opacity="0.55" stroke-width="3">
		<circle cx="70" cy="120" r="22" />
		<path d="M79 111 A11 11 0 1 0 79 129" />
		<text x="104" y="131" fill="#fff" fill-opacity="0.5" stroke="#000"
			stroke-opacity="0.25" stroke-width="1"
			font-family="Segoe UI, Helvetica, Arial, DejaVu Sans, sans-serif"
			font-size="30" font-weight="600">${text}</text>
	</g>
</svg>`;
}

/**
 * A proofing copy: at most `maxEdge` px, JPEG, no metadata (so no GPS), and
 * the label tiled across it unless `label` is null. Never a file a client
 * may download in full quality.
 */
export async function proofImage(
	input: Buffer,
	maxEdge: number,
	label: string | null,
) {
	const { data, info } = await sharp(input, { failOn: "none" })
		.rotate()
		.resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true })
		.toBuffer({ resolveWithObject: true });
	const image = sharp(data);
	if (label) {
		// The tile may not be larger than the image: shrink it for small ones.
		const scale = Math.min(
			1,
			info.width / TILE_WIDTH,
			info.height / TILE_HEIGHT,
		);
		image.composite([
			{ input: Buffer.from(tileSvg(label, scale)), tile: true },
		]);
	}
	return image.jpeg({ quality: OUTPUT_QUALITY, mozjpeg: true }).toBuffer();
}
