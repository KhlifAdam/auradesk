import "server-only";

import type { UsageKind } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { PLAN_LIMITS, type PlanLimits, storageBytesOf } from "./plans";
import { getSubscription } from "./queries";

/** The calendar month a monthly quota counts in, e.g. "2026-11" (UTC). */
export function currentPeriod(now = new Date()) {
	return now.toISOString().slice(0, 7);
}

/** Which plan limit each monthly counter is checked against. */
const LIMIT_OF: Record<UsageKind, keyof PlanLimits> = {
	ASSISTANT_MESSAGE: "assistantMessages",
	PHOTO_ANALYSIS: "photoAnalyses",
};

/**
 * The limits of the plan the photographer chose (also during the free month),
 * with the storage packs bought on top.
 */
export async function getPlanLimits(photographerId: string) {
	const { plan, storagePacks } = await getSubscription(photographerId);
	return {
		limits: PLAN_LIMITS[plan],
		storageBytes: storageBytesOf(plan, storagePacks),
	};
}

/**
 * Bytes the studio keeps in storage: gallery files, portfolio files, and
 * uploads still in progress (so parallel uploads can't overshoot the plan).
 */
export async function usedStorageBytes(photographerId: string) {
	const where = { photographerId };
	const [items, media, uploads] = await Promise.all([
		db.galleryItem.aggregate({ where, _sum: { size: true } }),
		db.media.aggregate({ where, _sum: { size: true } }),
		db.uploadSession.aggregate({ where, _sum: { size: true } }),
	]);
	return (
		Number(items._sum.size ?? 0) +
		(media._sum.size ?? 0) +
		Number(uploads._sum.size ?? 0)
	);
}

/** Whether `bytes` more still fit in the photographer's plan. */
export async function hasStorageFor(photographerId: string, bytes: number) {
	const [{ storageBytes }, used] = await Promise.all([
		getPlanLimits(photographerId),
		usedStorageBytes(photographerId),
	]);
	return used + bytes <= storageBytes;
}

/** How much of a monthly quota is used this month. */
export async function usedThisMonth(photographerId: string, kind: UsageKind) {
	const counter = await db.usageCounter.findUnique({
		where: {
			photographerId_period_kind: {
				photographerId,
				period: currentPeriod(),
				kind,
			},
		},
		select: { count: true },
	});
	return counter?.count ?? 0;
}

/** What's left of a monthly quota this month (never below zero). */
export async function remainingThisMonth(
	photographerId: string,
	kind: UsageKind,
) {
	const [{ limits }, used] = await Promise.all([
		getPlanLimits(photographerId),
		usedThisMonth(photographerId, kind),
	]);
	return Math.max(0, limits[LIMIT_OF[kind]] - used);
}

/** Counts `amount` uses of a monthly quota. */
export async function recordUsage(
	photographerId: string,
	kind: UsageKind,
	amount = 1,
) {
	if (amount <= 0) return;
	const period = currentPeriod();
	await db.usageCounter.upsert({
		where: { photographerId_period_kind: { photographerId, period, kind } },
		create: { photographerId, period, kind, count: amount },
		update: { count: { increment: amount } },
	});
}

/** People on the team or invited to it; declined invitations don't count. */
export function countTeamSeats(photographerId: string) {
	return db.teamMember.count({
		where: { photographerId, status: { in: ["PENDING", "ACCEPTED"] } },
	});
}

/** Everything the subscription page shows against the plan's limits. */
export async function getUsageSummary(photographerId: string) {
	const [{ limits, storageBytes }, storage, assistant, photos, team] =
		await Promise.all([
			getPlanLimits(photographerId),
			usedStorageBytes(photographerId),
			usedThisMonth(photographerId, "ASSISTANT_MESSAGE"),
			usedThisMonth(photographerId, "PHOTO_ANALYSIS"),
			countTeamSeats(photographerId),
		]);
	return {
		storage: { used: storage, limit: storageBytes },
		assistant: { used: assistant, limit: limits.assistantMessages },
		photos: { used: photos, limit: limits.photoAnalyses },
		team: { used: team, limit: limits.teamMembers },
	};
}

export type UsageSummary = Awaited<ReturnType<typeof getUsageSummary>>;
