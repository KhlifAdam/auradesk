"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import {
	deleteObjects,
	getUploadUrl,
	headObject,
	publicUrl,
} from "@/lib/storage/r2";
import {
	avatarKeySchema,
	avatarUploadSchema,
	sessionIdSchema,
} from "./schemas";

const AVATAR_TYPE = "image/jpeg";
/** Every profile photo of an account lives under this prefix. */
const avatarPrefix = (userId: string) => `avatars/${userId}/`;

/** The key of a profile photo this app stored for the user, if it is one. */
function ownAvatarKey(userId: string, image: string | null) {
	const base = publicUrl("");
	const key = image?.startsWith(base) ? image.slice(base.length) : null;
	return key?.startsWith(avatarPrefix(userId)) ? key : null;
}

/** Revalidates every page that shows the account's name or photo. */
function revalidateAccount() {
	revalidatePath("/", "layout");
}

/** A signed link the browser sends the (already shrunk) photo to. */
export async function startAvatarUpload(
	input: unknown,
): Promise<ActionResult<{ key: string; uploadUrl: string }>> {
	const { user } = await requireUser();
	const parsed = avatarUploadSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const key = `${avatarPrefix(user.id)}${randomUUID()}.jpg`;
	const uploadUrl = await getUploadUrl(key, AVATAR_TYPE, parsed.data.size);
	return ok({ key, uploadUrl });
}

/** Uses the uploaded photo, and removes the previous one from storage. */
export async function saveAvatar(input: unknown): Promise<ActionResult> {
	const { user } = await requireUser();
	const parsed = avatarKeySchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { key } = parsed.data;

	// Only a key of this account's own avatar folder, and only once stored.
	if (!key.startsWith(avatarPrefix(user.id))) return fail("invalidInput");
	if (!(await headObject(key))) return fail("uploadMissing");

	const previous = ownAvatarKey(user.id, user.image ?? null);
	await db.user.update({
		where: { id: user.id },
		data: { image: publicUrl(key) },
	});
	if (previous && previous !== key)
		await deleteObjects([previous]).catch(() => {});

	revalidateAccount();
	return ok();
}

/** Back to initials. A photo from Google or GitHub is just forgotten. */
export async function removeAvatar(): Promise<ActionResult> {
	const { user } = await requireUser();
	const previous = ownAvatarKey(user.id, user.image ?? null);
	await db.user.update({ where: { id: user.id }, data: { image: null } });
	if (previous) await deleteObjects([previous]).catch(() => {});

	revalidateAccount();
	return ok();
}

/** Signs one device out. The current one goes through "Log out" instead. */
export async function revokeSession(input: unknown): Promise<ActionResult> {
	const { user, session } = await requireUser();
	const parsed = sessionIdSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	if (parsed.data === session.id) return fail("invalidInput");

	const { count } = await db.session.deleteMany({
		where: { id: parsed.data, userId: user.id },
	});
	if (count === 0) return fail("notFound");
	revalidatePath("/", "layout");
	return ok();
}

/** Signs every other device out, e.g. after losing a phone. */
export async function revokeOtherSessions(): Promise<
	ActionResult<{ count: number }>
> {
	const { user, session } = await requireUser();
	const { count } = await db.session.deleteMany({
		where: { userId: user.id, id: { not: session.id } },
	});
	revalidatePath("/", "layout");
	return ok({ count });
}
