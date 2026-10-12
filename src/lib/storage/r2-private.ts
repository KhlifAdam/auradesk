import "server-only";

import { getR2PrivateEnv } from "@/lib/env";
import {
	deleteKeys,
	getObjectHead,
	getObjectStream,
	head,
	presignDownload,
	presignGet,
	presignPut,
} from "./s3-core";
import {
	abortMultipart,
	completeMultipart,
	createMultipart,
	listParts,
	presignPart,
	type StoredPart,
} from "./s3-multipart";

const VIEW_URL_TTL_SECONDS = 60 * 60;
/** Used right away by the browser: a few minutes is plenty. */
const DOWNLOAD_URL_TTL_SECONDS = 5 * 60;
/** Signatures are made at the start of a window, so URLs repeat and stay cacheable. */
const SIGNING_WINDOW_MS = 15 * 60 * 1000;

const bucket = () => getR2PrivateEnv().R2_PRIVATE_BUCKET;

/**
 * Private bucket for client galleries. It has no public access: objects are
 * only reachable through short-lived signed URLs, issued after an access check.
 */
export function getPrivateUploadUrl(
	key: string,
	contentType: string,
	size: number,
) {
	return presignPut(bucket(), key, contentType, size);
}

export function getPrivateViewUrl(key: string) {
	const windowStart = Math.floor(Date.now() / SIGNING_WINDOW_MS);
	return presignGet(
		bucket(),
		key,
		VIEW_URL_TTL_SECONDS,
		new Date(windowStart * SIGNING_WINDOW_MS),
	);
}

export function headPrivateObject(key: string) {
	return head(bucket(), key);
}

export function deletePrivateObjects(keys: string[]) {
	return deleteKeys(bucket(), keys);
}

// Large files (project imports) go up in parts, so a cut connection only
// costs the part in flight and the upload can resume later.

export function startPrivateMultipart(key: string, contentType: string) {
	return createMultipart(bucket(), key, contentType);
}

export function signPrivatePart(
	key: string,
	uploadId: string,
	partNumber: number,
) {
	return presignPart(bucket(), key, uploadId, partNumber);
}

export function listPrivateParts(key: string, uploadId: string) {
	return listParts(bucket(), key, uploadId);
}

export function completePrivateMultipart(
	key: string,
	uploadId: string,
	parts: StoredPart[],
) {
	return completeMultipart(bucket(), key, uploadId, parts);
}

export function abortPrivateMultipart(key: string, uploadId: string) {
	return abortMultipart(bucket(), key, uploadId);
}

/** A short link that downloads the file under its original name. */
export function getPrivateDownloadUrl(key: string, filename: string) {
	return presignDownload(bucket(), key, filename, DOWNLOAD_URL_TTL_SECONDS);
}

/** The start of a private file, enough for its metadata header. */
export function readPrivateObjectHead(key: string, bytes: number) {
	return getObjectHead(bucket(), key, bytes);
}

export function readPrivateObject(key: string) {
	return getObjectStream(bucket(), key);
}
