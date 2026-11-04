import { publicUrl } from "@/lib/storage/r2";

/** Every profile photo of an account lives under this prefix. */
export const avatarPrefix = (userId: string) => `avatars/${userId}/`;

/** The key of a profile photo this app stored for the user, if it is one. */
export function ownAvatarKey(userId: string, image: string | null) {
	const base = publicUrl("");
	const key = image?.startsWith(base) ? image.slice(base.length) : null;
	return key?.startsWith(avatarPrefix(userId)) ? key : null;
}
