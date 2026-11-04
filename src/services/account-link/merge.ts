import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isPhoneEmail } from "@/lib/phone";

type Tx = Prisma.TransactionClient;

/**
 * Folds the client account `fromId` into `intoId`, the account signed in:
 * projects, invoices, messages and the rest change owner, the sign-in methods
 * (password, Google) and missing contacts move over, then `fromId` is deleted.
 * The session stays valid, since the surviving account is the one signed in.
 * Only call it once the user has proven they own both accounts.
 */
export async function mergeAccounts(intoId: string, fromId: string) {
	await db.$transaction(async (tx) => {
		await moveOwnedRows(tx, intoId, fromId);
		await mergeConversations(tx, intoId, fromId);
		await mergeClientProfiles(tx, intoId, fromId);

		const [into, from] = await Promise.all([
			tx.user.findUniqueOrThrow({ where: { id: intoId } }),
			tx.user.findUniqueOrThrow({ where: { id: fromId } }),
		]);
		// Frees the email and phone number before they move (both are unique).
		await tx.user.delete({ where: { id: fromId } });

		const intoHasEmail = !isPhoneEmail(into.email);
		const fromHasEmail = !isPhoneEmail(from.email);
		const takeEmail = !intoHasEmail && fromHasEmail;
		const takePhone = !into.phoneNumber && Boolean(from.phoneNumber);
		// A phone account is named after its number until the client changes it.
		const placeholderName = !into.name || into.name === into.phoneNumber;

		await tx.user.update({
			where: { id: intoId },
			data: {
				...(takeEmail && {
					email: from.email,
					emailVerified: from.emailVerified,
				}),
				...(takePhone && {
					phoneNumber: from.phoneNumber,
					phoneNumberVerified: from.phoneNumberVerified,
				}),
				...(placeholderName && from.name && { name: from.name }),
				...(!into.image && from.image && { image: from.image }),
				...(!into.locale && from.locale && { locale: from.locale }),
			},
		});
	});
}

/** Rows that simply change owner. */
async function moveOwnedRows(tx: Tx, intoId: string, fromId: string) {
	const client = { where: { clientId: fromId }, data: { clientId: intoId } };
	await tx.project.updateMany(client);
	await tx.booking.updateMany(client);
	await tx.invoice.updateMany(client);
	await tx.quote.updateMany(client);
	await tx.photoBook.updateMany(client);
	await tx.galleryComment.updateMany({
		where: { authorId: fromId },
		data: { authorId: intoId },
	});
	await tx.message.updateMany({
		where: { senderId: fromId },
		data: { senderId: intoId },
	});
	await tx.assistantThread.updateMany({
		where: { userId: fromId },
		data: { userId: intoId },
	});
	await tx.teamMember.updateMany({
		where: { userId: fromId },
		data: { userId: intoId },
	});
	// Sign-in methods: the password and Google login of the email account.
	await tx.account.updateMany({
		where: { userId: fromId },
		data: { userId: intoId },
	});
}

/** One conversation per studio: messages join the one the account already has. */
async function mergeConversations(tx: Tx, intoId: string, fromId: string) {
	await tx.conversation.updateMany({
		where: { lastSenderId: fromId },
		data: { lastSenderId: intoId },
	});
	const conversations = await tx.conversation.findMany({
		where: { clientId: fromId },
	});
	for (const from of conversations) {
		const into = await tx.conversation.findUnique({
			where: {
				photographerId_clientId: {
					photographerId: from.photographerId,
					clientId: intoId,
				},
			},
		});
		if (!into) {
			await tx.conversation.update({
				where: { id: from.id },
				data: { clientId: intoId },
			});
			continue;
		}
		await tx.message.updateMany({
			where: { conversationId: from.id },
			data: { conversationId: into.id },
		});
		const fromIsLatest =
			(from.lastMessageAt?.getTime() ?? 0) >
			(into.lastMessageAt?.getTime() ?? 0);
		await tx.conversation.update({
			where: { id: into.id },
			data: {
				photographerUnread: into.photographerUnread + from.photographerUnread,
				clientUnread: into.clientUnread + from.clientUnread,
				...(fromIsLatest && {
					lastMessageAt: from.lastMessageAt,
					lastMessagePreview: from.lastMessagePreview,
					lastSenderId: from.lastSenderId,
				}),
			},
		});
		await tx.conversation.delete({ where: { id: from.id } });
	}
}

/** One profile per studio: the studio's notes on both are kept together. */
async function mergeClientProfiles(tx: Tx, intoId: string, fromId: string) {
	const profiles = await tx.clientProfile.findMany({
		where: { clientId: fromId },
	});
	for (const from of profiles) {
		const into = await tx.clientProfile.findUnique({
			where: {
				photographerId_clientId: {
					photographerId: from.photographerId,
					clientId: intoId,
				},
			},
		});
		if (!into) {
			await tx.clientProfile.update({
				where: { id: from.id },
				data: { clientId: intoId },
			});
			continue;
		}
		const notes = [into.notes, from.notes].filter(Boolean).join("\n\n");
		await tx.clientProfile.update({
			where: { id: into.id },
			data: { notes: notes || null },
		});
		await tx.clientProfile.delete({ where: { id: from.id } });
	}
}
