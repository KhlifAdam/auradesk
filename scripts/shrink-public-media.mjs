// Brings public-site photos uploaded before web resizing down to web size
// (longest side 3000 px). Camera originals of 5–8 MB are too heavy for the
// image optimizer to fetch in time when a page shows many at once.
//   pnpm media:shrink            shows what would change
//   pnpm media:shrink --apply    does it
// Each photo keeps its address. The original is first copied next to it
// (`<key>.original`), so nothing is lost; delete those copies once happy.

import {
	CopyObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import pg from "pg";
import sharp from "sharp";

const MAX_EDGE = 3000;
const apply = process.argv.includes("--apply");

process.loadEnvFile(".env");
const env = process.env;
const s3 = new S3Client({
	region: "auto",
	endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
});
const bucket = env.R2_BUCKET;

const encoders = {
	"image/jpeg": (img) => img.jpeg({ quality: 88, mozjpeg: true }),
	"image/png": (img) => img.png({ compressionLevel: 9 }),
	"image/webp": (img) => img.webp({ quality: 88 }),
};

const db = new pg.Client({ connectionString: env.DATABASE_URL });
await db.connect();
try {
	const { rows } = await db.query(
		`select id, key, mime_type, size, width, height from media
		 where type = 'IMAGE' and mime_type = any($1) and greatest(width, height) > $2
		 order by created_at`,
		[Object.keys(encoders), MAX_EDGE],
	);
	console.log(`${rows.length} photo(s) larger than ${MAX_EDGE} px.`);

	for (const row of rows) {
		const label = `${row.key} (${row.width}×${row.height}, ${(row.size / 1e6).toFixed(1)} MB)`;
		if (!apply) {
			console.log(`would shrink ${label}`);
			continue;
		}
		const object = await s3.send(
			new GetObjectCommand({ Bucket: bucket, Key: row.key }),
		);
		const input = Buffer.from(await object.Body.transformToByteArray());
		// Upright, no metadata (so no GPS), longest side at most MAX_EDGE.
		const { data, info } = await encoders[row.mime_type](
			sharp(input).rotate().resize(MAX_EDGE, MAX_EDGE, {
				fit: "inside",
				withoutEnlargement: true,
			}),
		).toBuffer({ resolveWithObject: true });

		await s3.send(
			new CopyObjectCommand({
				Bucket: bucket,
				CopySource: `${bucket}/${encodeURIComponent(row.key)}`,
				Key: `${row.key}.original`,
			}),
		);
		await s3.send(
			new PutObjectCommand({
				Bucket: bucket,
				Key: row.key,
				Body: data,
				ContentType: row.mime_type,
				CacheControl: object.CacheControl,
			}),
		);
		await db.query(
			"update media set size = $2, width = $3, height = $4 where id = $1",
			[row.id, data.length, info.width, info.height],
		);
		console.log(
			`shrunk ${label} → ${info.width}×${info.height}, ${(data.length / 1e6).toFixed(1)} MB`,
		);
	}
	if (!apply && rows.length > 0) console.log("Run again with --apply to do it.");
} finally {
	await db.end();
}
