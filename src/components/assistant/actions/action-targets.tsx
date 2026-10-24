"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { describeActionTargets } from "@/services/assistant/describe-action";
import type { ActionTarget } from "@/services/assistant/types";

/**
 * The real records behind an action's ids: undefined while loading, null when
 * one of them isn't the user's (or no longer exists).
 */
export function useActionTargets(input: object | undefined) {
	const [targets, setTargets] = useState<ActionTarget[] | null | undefined>();
	const key = input ? JSON.stringify(input) : null;

	useEffect(() => {
		if (!key) return;
		let alive = true;
		setTargets(undefined);
		describeActionTargets(JSON.parse(key))
			.then((result) => alive && setTargets(result))
			.catch(() => alive && setTargets(null));
		return () => {
			alive = false;
		};
	}, [key]);

	return targets;
}

export function ActionTargets({
	targets,
}: {
	targets: ActionTarget[] | null | undefined;
}) {
	if (targets === undefined)
		return <div className="h-9 animate-pulse rounded-lg bg-muted/60" />;
	if (!targets?.length) return null;

	return (
		<ul className="flex flex-col divide-y divide-border/60 rounded-lg border border-border bg-card">
			{targets.map((target) => (
				<li key={`${target.href}-${target.title}`}>
					{target.href ? (
						<Link
							href={target.href}
							className="group flex items-center gap-2 px-2.5 py-1.5 transition-colors hover:bg-muted/50"
						>
							<TargetText target={target} />
							<ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
						</Link>
					) : (
						<div className="px-2.5 py-1.5">
							<TargetText target={target} />
						</div>
					)}
				</li>
			))}
		</ul>
	);
}

function TargetText({ target }: { target: ActionTarget }) {
	return (
		<div className="min-w-0 flex-1">
			<p className="truncate text-sm font-medium">{target.title}</p>
			{target.subtitle && (
				<p className="truncate text-xs text-muted-foreground">
					{target.subtitle}
				</p>
			)}
		</div>
	);
}
