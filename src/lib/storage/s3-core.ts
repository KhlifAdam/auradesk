import "server-only";

import {
	DeleteObjectsCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { attachmentHeader } from "@/lib/content-disposition";
import { getR2Credentials } from "@/lib/env";

const UPLOAD_URL_TTL_SECONDS = 60 * 10;
const DELETE_BATCH_SIZE = 1000;

let client: S3Client | undefined;

export function getClient() {
	const env = getR2Credentials();
	client ??= new S3Client({
		region: "auto",
		endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: env.R2_ACCESS_KEY_ID,
			secretAccessKey: env.R2_SECRET_ACCESS_KEY,
		},
	});
	return client;
}

/** Presigned PUT URL; the browser uploads straight to the bucket with it. */
export function presignPut(
	bucket: string,
	key: string,
	contentType: string,
	size: number,
) {
	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: key,
		ContentType: contentType,
		ContentLength: size,
	});
	return getSignedUrl(getClient(), command, {
		expiresIn: UPLOAD_URL_TTL_SECONDS,
	});
}

/** Presigned GET URL. A fixed `signingDate` keeps the URL stable for caching. */
export function presignGet(
	bucket: string,
	key: string,
	expiresIn: number,
	signingDate?: Date,
) {
	return getSignedUrl(
		getClient(),
		new GetObjectCommand({ Bucket: bucket, Key: key }),
		{ expiresIn, signingDate },
	);
}

/** Returns the stored object's size and type, or null if it doesn't exist. */
export async function head(bucket: string, key: string) {
	try {
		const res = await getClient().send(
			new HeadObjectCommand({ Bucket: bucket, Key: key }),
		);
		return { size: res.ContentLength ?? 0, contentType: res.ContentType };
	} catch {
		return null;
	}
}

export async function deleteKeys(bucket: string, keys: string[]) {
	for (let i = 0; i < keys.length; i += DELETE_BATCH_SIZE) {
		const batch = keys.slice(i, i + DELETE_BATCH_SIZE);
		await getClient().send(
			new DeleteObjectsCommand({
				Bucket: bucket,
				Delete: { Objects: batch.map((Key) => ({ Key })) },
			}),
		);
	}
}

/** Presigned GET that makes the browser save the file under `filename`. */
export function presignDownload(
	bucket: string,
	key: string,
	filename: string,
	expiresIn: number,
) {
	return getSignedUrl(
		getClient(),
		new GetObjectCommand({
			Bucket: bucket,
			Key: key,
			ResponseContentDisposition: attachmentHeader(filename),
		}),
		{ expiresIn },
	);
}

/** The first `bytes` bytes of an object, e.g. to read a file's header. */
export async function getObjectHead(
	bucket: string,
	key: string,
	bytes: number,
) {
	const res = await getClient().send(
		new GetObjectCommand({
			Bucket: bucket,
			Key: key,
			Range: `bytes=0-${bytes - 1}`,
		}),
	);
	if (!res.Body) throw new Error(`Empty object ${key}`);
	return Buffer.from(await res.Body.transformToByteArray());
}

/** The object's bytes as a web stream, for the server to pass along. */
export async function getObjectStream(bucket: string, key: string) {
	const res = await getClient().send(
		new GetObjectCommand({ Bucket: bucket, Key: key }),
	);
	if (!res.Body) throw new Error(`Empty object ${key}`);
	return res.Body.transformToWebStream();
}
