"use client";

import { Check, Copy, MessageSquareText, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface DevSms {
	id: number;
	to: string;
	body: string;
	at: string;
}

const POLL_MS = 2000;
/** The one-time code in a message, if it has one. */
const CODE = /\b\d{6}\b/;

const fetchInbox = (url: string) =>
	fetch(url).then((res) => (res.ok ? res.json() : { messages: [] }));

/**
 * Development only: a stand-in phone that shows the texts the app "sends"
 * (codes, invitations), since none really leave. Opens on a new message.
 */
export function DevSmsInbox() {
	const t = useTranslations("DevSms");
	const { data } = useSWR<{ messages: DevSms[] }>("/api/dev/sms", fetchInbox, {
		refreshInterval: POLL_MS,
	});
	const messages = data?.messages ?? [];
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState<number | null>(null);
	const lastSeen = useRef<number | null>(null);
	const latest = messages[0]?.id ?? null;

	// A new text arrived since the last look: show it.
	useEffect(() => {
		if (latest === null) return;
		if (lastSeen.current !== null && latest > lastSeen.current) setOpen(true);
		lastSeen.current = latest;
	}, [latest]);

	const copy = async (message: DevSms, code: string) => {
		await navigator.clipboard.writeText(code);
		setCopied(message.id);
		setTimeout(() => setCopied(null), 1500);
	};

	return (
		<div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
			{open && (
				<section className="w-80 overflow-hidden rounded-2xl border border-border bg-background/95 shadow-luminous-lg backdrop-blur-xl">
					<header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
						<p className="flex items-center gap-1.5 text-xs font-semibold">
							<MessageSquareText className="h-3.5 w-3.5 text-primary" />
							{t("title")}
						</p>
						<button
							type="button"
							onClick={() => setOpen(false)}
							aria-label={t("close")}
							className="text-muted-foreground hover:text-foreground"
						>
							<X className="h-3.5 w-3.5" />
						</button>
					</header>
					<p className="border-b border-border bg-muted/50 px-3 py-1.5 text-[11px] text-muted-foreground">
						{t("hint")}
					</p>
					<ul className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
						{messages.length === 0 && (
							<li className="px-3 py-4 text-center text-xs text-muted-foreground">
								{t("empty")}
							</li>
						)}
						{messages.map((message) => {
							const code = message.body.match(CODE)?.[0];
							return (
								<li key={message.id} className="flex flex-col gap-1 px-3 py-2">
									<span className="flex justify-between text-[11px] text-muted-foreground">
										<span>{t("to", { phone: formatPhone(message.to) })}</span>
										<span>{new Date(message.at).toLocaleTimeString()}</span>
									</span>
									<p className="text-xs leading-snug">{message.body}</p>
									{code && (
										<button
											type="button"
											onClick={() => copy(message, code)}
											className="flex w-fit items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 font-mono text-sm font-semibold tracking-widest text-primary transition-colors hover:bg-primary/20"
										>
											{code}
											{copied === message.id ? (
												<Check className="h-3.5 w-3.5" />
											) : (
												<Copy className="h-3.5 w-3.5" />
											)}
										</button>
									)}
								</li>
							);
						})}
					</ul>
				</section>
			)}
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				className={cn(
					"flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium shadow backdrop-blur transition-all duration-200 hover:border-primary/50",
					open && "border-primary/50",
				)}
			>
				<MessageSquareText className="h-3.5 w-3.5 text-primary" />
				{t("button", { count: messages.length })}
			</button>
		</div>
	);
}
